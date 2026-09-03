# eslint-plugin-no-spanish

[![npm version](https://img.shields.io/npm/v/eslint-plugin-no-spanish.svg)](https://www.npmjs.com/package/eslint-plugin-no-spanish)
[![npm downloads](https://img.shields.io/npm/dw/eslint-plugin-no-spanish.svg)](https://www.npmjs.com/package/eslint-plugin-no-spanish)
[![CI](https://github.com/Nicolasramos411/eslint-plugin-no-spanish/actions/workflows/ci.yml/badge.svg)](https://github.com/Nicolasramos411/eslint-plugin-no-spanish/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/eslint-plugin-no-spanish.svg)](./LICENSE)
[![Known Vulnerabilities](https://snyk.io/test/npm/eslint-plugin-no-spanish/badge.svg)](https://snyk.io/test/npm/eslint-plugin-no-spanish)

[Socket.dev report](https://socket.dev/npm/package/eslint-plugin-no-spanish)

Flags Spanish comments and Spanish variable/function/class names to keep
language usage consistent across a JS/TS codebase — useful for teams
with mixed-language contributors (e.g. an English-language codebase
with Spanish-speaking contributors) who want that drift caught
automatically instead of in code review.

Two rules:

- **`no-es-comment`** — flags comments written in Spanish.
- **`no-es-identifier`** — flags variable, function, class, method, TS
  interface/type-alias/enum/namespace names, and catch-clause bindings
  written in Spanish.

Both are heuristic (see "Known limitations"), so start with `warn` and
tune with the options below rather than expecting perfect results
out of the box.

## Quick start

```bash
npm install -D eslint-plugin-no-spanish
```

`eslint.config.js` (ESLint ≥ 9):

```js
const noSpanish = require('eslint-plugin-no-spanish');

module.exports = [
  // ...your existing config
  noSpanish.configs.recommended, // both rules at "warn"
];
```

`.eslintrc.json` (ESLint 8 and earlier):

```json
{
  "plugins": ["no-spanish"],
  "rules": {
    "no-spanish/no-es-comment": "warn",
    "no-spanish/no-es-identifier": "warn"
  }
}
```

That's it — run your normal `eslint` command and it'll start flagging
Spanish comments and identifiers. Keep reading for options, the faster
standalone CLI, and how to suppress a false positive on one line.

## Rule: `no-es-comment`

Detects Spanish in comment text using three layers:

1. Spanish-only characters (`ñ`, tildes, `¿¡`) combined with at least one
   real Spanish stopword — not the accented character alone, so an
   English comment that just contains an accented name or borrowed word
   (`// Fix the café menu bug`) isn't flagged on that basis by itself.
2. Stopword ratio for short/medium comments (under ~40 chars), since
   n-gram language detection is unreliable on little text.
3. [`franc-min`](https://www.npmjs.com/package/franc-min) n-gram
   detection for longer comments.

`eslint-disable*`/`eslint-enable*`/`no-es-ignore*` directive comments are
never run through this detector — otherwise a plain
`// eslint-disable-next-line import/no-extraneous-dependencies` would
itself read as Spanish (two of the most common substrings in that syntax
happen to be Spanish stopwords).

Options:

```json
{
  "no-spanish/no-es-comment": ["warn", {
    "minLength": 12,
    "minWords": 3,
    "ignorePatterns": ["^TODO", "^eslint-disable"]
  }]
}
```

| Option | Default | What it does |
|---|---|---|
| `minLength` | `12` | Minimum comment length before language detection kicks in. |
| `minWords` | `3` | Minimum word count before language detection kicks in. |
| `ignorePatterns` | `[]` | Regex strings; comments matching any of these are skipped. |

## Rule: `no-es-identifier`

Splits camelCase/PascalCase/snake_case identifiers into words and checks
them against a curated Spanish word dictionary (general-purpose business
and programming vocabulary — `obtener`, `usuario`, `guardar`, `reporte`,
etc — not tied to any one company's domain).

Options:

```json
{
  "no-spanish/no-es-identifier": ["warn", {
    "minRatio": 0.5,
    "ignoreNames": ["rut", "folio", "dte", "giro"],
    "extraWords": ["envio", "bodega"]
  }]
}
```

| Option | Default | What it does |
|---|---|---|
| `minRatio` | `0.5` | Fraction of an identifier's words that must be Spanish to flag it. Lower it for stricter enforcement on mixed names like `getUsuarioById`. |
| `ignoreNames` | `[]` | Exact names to never flag — use for fiscal/API field names you're required to keep in Spanish (SII, SAT/CFDI, DIAN, SRI, etc). |
| `extraWords` | `[]` | Extra Spanish words for your project's own vocabulary (e.g. `factura`, `boleta`, `sucursal` for a fintech app) — the intended way to extend coverage, rather than growing the built-in dictionary. |

The dictionary deliberately favors precision over recall: it's checked
against [`an-array-of-english-words`](https://www.npmjs.com/package/an-array-of-english-words)
in CI so it can never silently gain a word that's also a common English
identifier (`roles`, `total`, `error`, `color` and others were caught and
removed this way — each would have flagged legitimate English code like
`const userRoles = [...]`). Use `extraWords` to fill gaps for your own
project instead of expecting full coverage out of the box.

## Suppressing a false positive on one line

Through ESLint, the standard directive just works:

```ts
// eslint-disable-next-line no-spanish/no-es-identifier
const montoTotal = 1;
```

This package also understands its own `no-es-ignore-next-line` /
`no-es-ignore-line`, which — unlike `eslint-disable`, whose prefix
depends on how *you* aliased the plugin — works identically whether
you're running the ESLint rule or the standalone CLI below:

```ts
// no-es-ignore-next-line
const montoTotal = 1;

const montoTotal = 1; // no-es-ignore-line
```

## Faster standalone check (`no-es-check`)

Running these two rules *through ESLint* means paying ESLint's full
per-file cost (config resolution, a type-aware TS parse, traversal with
every other rule you have configured). On a ~2,300-file repo that's the
difference between ~10s and under 1s. For a pre-commit hook, a `watch`
script, or just a quick check without waiting for the full lint, use the
bundled CLI instead — it reuses the exact same detection logic, so
results match:

```bash
npx no-es-check .                          # scans .ts/.tsx/.js/.jsx/.mjs/.cjs under the given dir
npx no-es-check . --ext .ts,.tsx           # restrict which extensions get scanned
npx no-es-check . --extra-words envio,bodega
npx no-es-check . --ignore-names rut,folio
npx no-es-check . --min-length 12 --min-words 3 --ignore-patterns '^TODO'
npx no-es-check --help
```

Exit code is `1` if anything is found *or* if a file failed to parse.
It's fast for two reasons: it skips ESLint's engine entirely (walking
the filesystem and parsing directly), and it splits work across
`os.cpus().length` `worker_threads` since every file is independent.

Identifier detection needs a real parse to tell a declaration from a
property access or string content — it uses
[`@swc/core`](https://www.npmjs.com/package/@swc/core), a peer dependency
you install yourself if you want that check:

```bash
npm install -D @swc/core
```

Without it, `no-es-check` still runs the (dependency-free) comment check
and skips the identifier check with a note, rather than failing.

## Known limitations

- Both rules are heuristic, not perfect. Expect the occasional false
  positive on short/ambiguous names and false negatives on Spanglish.
- `no-es-identifier` does not check destructured variables
  (`const { monto } = req.body`) or object literal keys outside class
  members, to avoid flagging fields required by external APIs.

## TypeScript

Type declarations for the rule options and `configs.recommended` ship in
`lib/index.d.ts` — no `@types/eslint` dependency required.
