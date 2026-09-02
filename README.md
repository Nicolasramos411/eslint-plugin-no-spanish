# @nicolasramos41/eslint-plugin-no-es

Two ESLint rules that keep a JS/TS codebase in English:

- `no-es-comment` — flags comments written in Spanish.
- `no-es-identifier` — flags variable, function, class, method, TS
  interface/type-alias/enum/namespace names, and catch-clause bindings
  written in Spanish.

Both rules honor `eslint-disable(-next-line|-line)` when run through
ESLint, plus a package-specific `no-es-ignore-next-line`/`no-es-ignore-line`
directive that also works with the standalone CLI below — see
"Suppressing a specific line".

## Install

```bash
npm install -D @nicolasramos41/eslint-plugin-no-es
```

If you're vendoring this as a subfolder of a monorepo instead of
installing the published package, use a local file dependency:

```bash
npm install -D ./eslint-plugin-no-es
```

Optionally, also install `@swc/core` if you want `no-es-check`'s identifier
check (see "Fast standalone check" below) — it's a peer dependency and
won't be installed for you automatically:

```bash
npm install -D @swc/core
```

Type declarations for the rule options and `configs.recommended` ship in
`lib/index.d.ts` (no `@types/eslint` dependency required).

## Usage

### Flat config (`eslint.config.js` / `eslint.config.mjs`, ESLint ≥ 9)

```js
const noEs = require('@nicolasramos41/eslint-plugin-no-es');
// or: import noEs from '@nicolasramos41/eslint-plugin-no-es';

module.exports = [
  // ...your existing config (next/core-web-vitals, etc.)
  noEs.configs.recommended, // both rules at "warn"
];
```

To set your own severity instead of the preset:

```js
module.exports = [
  {
    plugins: { 'no-es': noEs },
    rules: {
      'no-es/no-es-comment': 'error',
      'no-es/no-es-identifier': 'warn',
    },
  },
];
```

### Legacy config (`.eslintrc.json`)

ESLint auto-derives the plugin's short name from the package name
(`@nicolasramos41/eslint-plugin-no-es` → `@nicolasramos41/no-es`):

```json
{
  "plugins": ["@nicolasramos41/no-es"],
  "rules": {
    "@nicolasramos41/no-es/no-es-comment": "warn",
    "@nicolasramos41/no-es/no-es-identifier": "warn"
  }
}
```

That's more to type than the flat config's `no-es/...`, since the flat
config's alias is whatever key *you* pick in `plugins: { ... }` — see
above. The legacy config's prefix, by contrast, is tied to the scoped
package name and isn't something this package can shorten for you.

## Rule: `no-es-comment`

Detects Spanish in comment text using three layers:

1. Spanish-only characters (`ñ`, tildes, `¿¡`) **combined with at least
   one real Spanish stopword** — not the accented character alone, so an
   English comment that just contains an accented name or borrowed word
   (`// Fix the café menu bug`, `// @author Nicolás Ramos`) isn't flagged
   on that basis by itself.
2. Stopword ratio for short/medium comments (under ~40 chars), since
   n-gram language detection is unreliable on little text.
3. [`franc-min`](https://www.npmjs.com/package/franc-min) n-gram
   detection (restricted to English/Spanish) for longer comments.

Directive comments (`eslint-disable*`, `eslint-enable*`, `no-es-ignore*`)
are never run through this detector at all — two of the most common
substrings in that syntax (a Spanish negation and a Spanish form of "to
be") happen to be common Spanish stopwords, so without this exclusion a
plain `// eslint-disable-next-line import/no-extraneous-dependencies`
would itself read as Spanish.

Options:

```json
{
  "no-es/no-es-comment": ["warn", {
    "minLength": 12,
    "minWords": 3,
    "ignorePatterns": ["^TODO", "^eslint-disable"]
  }]
}
```

## Rule: `no-es-identifier`

Splits camelCase/PascalCase/snake_case identifiers into words and checks
them against a curated Spanish word dictionary (general-purpose business
and programming vocabulary: `obtener`, `usuario`, `guardar`, `reporte`,
etc — not tied to any one company's domain). Checks: variable
declarations, function/class names, function parameters, and class
method/property names.

Options:

```json
{
  "no-es/no-es-identifier": ["warn", {
    "minRatio": 0.5,
    "ignoreNames": ["rut", "folio", "dte", "giro"],
    "extraWords": ["envio", "bodega"]
  }]
}
```

- `minRatio` — fraction of an identifier's words that must be Spanish to
  flag it. Lower it if you want stricter enforcement on mixed names like
  `getUsuarioById`.
- `ignoreNames` — exact names to skip. **Use this for fiscal/API field
  names you're required to keep in Spanish** (SII, SAT/CFDI, DIAN, SRI
  field names, etc.) — that's an intentional exception, not a violation.
- `extraWords` — your own project's Spanish vocabulary that isn't
  general enough for the core dictionary (fiscal/industry-specific terms,
  e.g. `factura`, `boleta`, `sucursal` for a fintech app). This is the
  intended way to extend coverage — prefer it over PRs that grow the core
  dictionary with niche business terms.

## Fast standalone check (`no-es-check`)

Running these two rules *through ESLint* means paying ESLint's full
per-file cost (config cascade, a type-aware TS parse, traversal with
every rule you have configured) just to get a couple of text/identifier
checks. On a ~2,300-file repo that's the difference between ~10s and
under 1s. If you want the fast path — a pre-commit hook, a `watch`
script, or just checking quickly without waiting for the full lint —
use the bundled CLI instead:

```bash
npx no-es-check .                          # scans .ts/.tsx/.js/.jsx/.mjs/.cjs under the given dir
npx no-es-check . --ext .ts,.tsx           # restrict which extensions get scanned
npx no-es-check . --extra-words envio,bodega
npx no-es-check . --ignore-names rut,folio
npx no-es-check . --min-length 12 --min-words 3 --ignore-patterns '^TODO'
npx no-es-check --help
```

Exit code is `1` if anything is found *or* if a file failed to parse —
a silent parse failure would otherwise mean the identifier check ran on
fewer files than you asked for while still reporting a clean pass.

It reuses the exact same detection functions as the ESLint rules (same
dictionary, same `isSpanish` heuristic, same directive handling), so
results match — it's not a separate, drifting reimplementation. It gets
its speed from two things instead of a different algorithm:

1. **No ESLint engine at all.** It walks the filesystem itself (following
   symlinked directories, with a real-path cycle guard) and skips
   dot-directories (`.git`, `.next`, `.worktrees`, ...) and
   `node_modules`, instead of paying ESLint's config-resolution and
   full-AST-traversal cost for two rules.
2. **Parallel, via `worker_threads`.** Every file is independent, so work
   is split across `os.cpus().length` workers. This is most of the win —
   see the benchmark below.

Comment detection uses a regex scan. Identifier detection needs a real
parse to know which names are *declarations* vs. property access or
string content — it uses [`@swc/core`](https://www.npmjs.com/package/@swc/core)
(a Rust-based parser, the same one Next.js uses, with `decorators: true`
so NestJS/Angular/TypeORM-style decorated classes parse) instead of
`@typescript-eslint/parser`, since we don't need type information, only
syntax. When `@swc/core` is available (it's an **optional peer
dependency** — install it yourself if you want the identifier check;
plain `npm install` won't pull it in for you), its parse is also used to
mask quote characters inside JSX text, so an English contraction like
`<p>Don't click</p>` can't be mistaken for the start of a string literal
and swallow real comments after it. Without `@swc/core` (or on a file
that fails to parse), `no-es-check` still runs the comment check with
that one caveat, and skips the identifier check for that file with a note
rather than failing.

Benchmark on this repo (2,258 `.ts`/`.tsx` files, 10-core machine):

| | time |
|---|---|
| `eslint .` with only these 2 rules enabled | ~9.9s |
| `no-es-check .` | **~0.7s** |

## Suppressing a specific line

Through ESLint, the standard directives just work:

```ts
// eslint-disable-next-line no-es/no-es-identifier
const montoTotal = 1;
```

`no-es-check` bypasses ESLint's engine, so it parses `eslint-disable`,
`eslint-disable-line`, `eslint-disable`/`eslint-enable` blocks, and this
package's own `no-es-ignore-next-line`/`no-es-ignore-line` itself — all
alias-agnostic (it matches by the rule's short name, e.g.
`no-es-identifier`, regardless of what you aliased the plugin to:
`no-es/no-es-identifier` and `some-alias/no-es-identifier` both work).
`no-es-ignore-next-line`/`no-es-ignore-line` are also understood by the
ESLint rules themselves, so that one directive is portable between both
ways of running this package — useful since your `eslint-disable` prefix
otherwise depends on how *you* aliased the plugin, which this package
can't control:

```ts
// no-es-ignore-next-line
const montoTotal = 1;

const montoTotal = 1; // no-es-ignore-line
```

### Why the dictionary is deliberately conservative

The core dictionary is checked against
[`an-array-of-english-words`](https://www.npmjs.com/package/an-array-of-english-words)
in `test/dictionary-collisions.test.js` so it can't silently gain a word
that's also a common English identifier (`roles`, `total`, `error`,
`color`, `menu`, `region`, `subtotal`, `valor` and `registrar` were all
caught and removed this way — every one of them would have flagged
completely legitimate English code, e.g. `const userRoles = [...]`).
If you extend `CORE_SPANISH_WORDS`, that test will fail on any new
collision until you've reviewed it and either drop the word or add it to
`REVIEWED_SAFE_OVERLAPS` with a one-line reason.

## Known limitations

- Both rules are heuristic, not perfect. Expect the occasional false
  positive on short/ambiguous names and false negatives on Spanglish.
- The core dictionary favors precision over recall: it's a curated,
  general-purpose vocabulary, not an exhaustive one, specifically to
  avoid the false-positive rate a huge, unfiltered Spanish wordlist would
  produce. Use `extraWords` to extend it for your project rather than
  expecting full coverage out of the box.
- `no-es-identifier` does not check destructured variables
  (`const { monto } = req.body`) or object literal keys outside
  class members, to avoid flagging fields required by external APIs.
  Extend `create()` in `lib/rules/no-es-identifier.js` if you want that
  covered too — just make sure to pair it with `ignoreNames` for
  legitimate Spanish API fields first, or you'll get noisy results.

## Publishing

```bash
cd eslint-plugin-no-es
npm login
npm publish --access public
```

`@nicolasramos41/eslint-plugin-no-es` is scoped, so `npm publish` defaults
to *restricted* (private, requires a paid plan) unless you pass
`--access public` explicitly — an unscoped `eslint-plugin-no-es` name was
rejected by npm's typosquat check as too similar to the existing
`eslint-plugin-node`.

Then in consuming repos: `npm install -D @nicolasramos41/eslint-plugin-no-es`.
