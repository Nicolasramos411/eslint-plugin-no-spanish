'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { findFiles } = require('../lib/cli/find-files');
const { extractComments } = require('../lib/cli/extract-comments');
const { run } = require('../lib/cli/run');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'no-es-cli-test-'));
}

describe('cli/find-files', () => {
  it('finds files with the given extensions and skips dot-directories', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, 'a.ts'), '');
    fs.writeFileSync(path.join(dir, 'skip.js'), '');
    fs.mkdirSync(path.join(dir, '.worktrees', 'nested'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.worktrees', 'nested', 'duplicate.ts'), '');
    fs.mkdirSync(path.join(dir, 'node_modules'));
    fs.writeFileSync(path.join(dir, 'node_modules', 'vendor.ts'), '');

    const files = findFiles(dir, { extensions: ['.ts'] });
    assert.deepStrictEqual(files, [path.join(dir, 'a.ts')]);
  });

  it('defaults to scanning .js/.jsx/.mjs/.cjs too, not just .ts/.tsx', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, 'a.ts'), '');
    fs.writeFileSync(path.join(dir, 'b.js'), '');
    fs.writeFileSync(path.join(dir, 'c.jsx'), '');
    fs.writeFileSync(path.join(dir, 'd.mjs'), '');
    fs.writeFileSync(path.join(dir, 'e.cjs'), '');
    fs.writeFileSync(path.join(dir, 'f.txt'), '');

    const files = findFiles(dir).map((f) => path.basename(f)).sort();
    assert.deepStrictEqual(files, ['a.ts', 'b.js', 'c.jsx', 'd.mjs', 'e.cjs']);
  });

  it('follows a symlinked directory without hanging on a cycle, and skips a broken symlink', () => {
    const dir = makeTmpDir();
    const real = path.join(dir, 'real');
    fs.mkdirSync(real);
    fs.writeFileSync(path.join(real, 'x.ts'), '');
    fs.symlinkSync(real, path.join(dir, 'linked'), 'dir');
    fs.symlinkSync('.', path.join(dir, 'loop'), 'dir'); // would recurse forever if not guarded
    fs.symlinkSync(path.join(dir, 'missing-target'), path.join(dir, 'broken'), 'dir');

    const files = findFiles(dir, { extensions: ['.ts'] });

    // `real` and `linked` resolve to the same physical directory, so the
    // cycle guard (keyed by real path) also dedupes it to a single report
    // instead of linting the same file twice under two apparent paths —
    // which of the two apparent paths wins depends on directory listing
    // order, so assert on content, not on which alias survived.
    assert.strictEqual(files.length, 1);
    assert.ok(fs.realpathSync(files[0]) === fs.realpathSync(path.join(real, 'x.ts')));
  });
});

describe('cli/extract-comments', () => {
  it('does not mistake a comment-like sequence inside a string for a comment', () => {
    const src = 'const url = "http://example.com"; // a real comment';
    const comments = extractComments(src);
    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0].text, 'a real comment');
  });

  it('reports the correct line for a comment after multiple newlines', () => {
    const src = 'const a = 1;\nconst b = 2;\n// tercera linea\n';
    const comments = extractComments(src);
    assert.strictEqual(comments[0].line, 3);
  });
});

describe('cli/run (end-to-end, matches the ESLint rules)', () => {
  it('finds the same comment and identifier issues the ESLint rules would', async () => {
    const dir = makeTmpDir();
    fs.writeFileSync(
      path.join(dir, 'sample.ts'),
      [
        '// esto es un comentario bastante largo en español',
        'const obtenerUsuario = () => {};',
        'const getUserById = (userId: number) => userId;',
        'const boleta = 1;', // only flagged once added via extraWords
      ].join('\n'),
    );

    const result = await run({
      dir,
      concurrency: 1,
      ruleOptions: { identifier: { extraWords: ['boleta'] } },
    });

    assert.strictEqual(result.filesScanned, 1);
    const rules = result.findings.map((f) => f.rule).sort();
    assert.deepStrictEqual(rules, ['no-es-comment', 'no-es-identifier', 'no-es-identifier']);

    const names = result.findings
      .filter((f) => f.rule === 'no-es-identifier')
      .map((f) => f.message);
    assert.ok(names.some((m) => m.includes('obtenerUsuario')));
    assert.ok(names.some((m) => m.includes('boleta')));
  });

  it('parses decorated classes instead of silently skipping the whole file', async () => {
    const dir = makeTmpDir();
    fs.writeFileSync(
      path.join(dir, 'sample.ts'),
      '@Injectable()\nexport class ServicioUsuario {\n  obtenerUsuario() {}\n}\n',
    );

    const result = await run({ dir, concurrency: 1 });

    assert.deepStrictEqual(result.errors, []);
    const names = result.findings.map((f) => f.message);
    assert.ok(names.some((m) => m.includes('ServicioUsuario')));
    assert.ok(names.some((m) => m.includes('obtenerUsuario')));
  });

  it('checks TS interface/type-alias/enum/namespace names and catch-clause bindings', async () => {
    const dir = makeTmpDir();
    fs.writeFileSync(
      path.join(dir, 'sample.ts'),
      [
        'interface Usuario { nombre: string }',
        'type RespuestaUsuario = { ok: boolean };',
        'enum EstadoPedido { uno = 1 }',
        'namespace ServiciosDeUsuario { export const x = 1; }',
        'try {} catch (errorUsuario) {}',
      ].join('\n'),
    );

    const result = await run({ dir, concurrency: 1 });

    const flagged = result.findings.map((f) => f.message).join('\n');
    for (const name of ['Usuario', 'RespuestaUsuario', 'EstadoPedido', 'ServiciosDeUsuario', 'errorUsuario']) {
      assert.ok(flagged.includes(name), `expected "${name}" to be flagged`);
    }
  });

  it('does not mistake a JSX apostrophe for a string, so real comments after it still count', async () => {
    const dir = makeTmpDir();
    fs.writeFileSync(
      path.join(dir, 'sample.tsx'),
      [
        "export const C = () => <p>Don't click</p>;",
        '// esto es un comentario bastante largo en espanol que deberia ser detectado',
        'const z = 1;',
      ].join('\n'),
    );

    const result = await run({ dir, concurrency: 1 });

    assert.strictEqual(result.findings.length, 1);
    assert.strictEqual(result.findings[0].rule, 'no-es-comment');
  });

  it('honors eslint-disable-next-line for both rules, alias-agnostically', async () => {
    const dir = makeTmpDir();
    fs.writeFileSync(
      path.join(dir, 'sample.ts'),
      [
        '// eslint-disable-next-line @some-org/no-es/no-es-identifier', // proves alias-agnostic matching
        'const obtenerUsuario = 1;',
        '// eslint-disable-next-line no-es-comment',
        '// esto es un comentario bastante largo en espanol que deberia ser detectado',
      ].join('\n'),
    );

    const result = await run({ dir, concurrency: 1 });

    assert.deepStrictEqual(result.findings, []);
  });

  it('honors the package-specific no-es-ignore-next-line/-line directives', async () => {
    const dir = makeTmpDir();
    fs.writeFileSync(
      path.join(dir, 'sample.ts'),
      [
        '// no-es-ignore-next-line',
        'const obtenerUsuario = 1;',
        'const crearReporte = 2; // no-es-ignore-line',
      ].join('\n'),
    );

    const result = await run({ dir, concurrency: 1 });

    assert.deepStrictEqual(result.findings, []);
  });
});
