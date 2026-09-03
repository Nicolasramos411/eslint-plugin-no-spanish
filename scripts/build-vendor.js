'use strict';

// franc-min@6+ is ESM-only, but `isSpanish()` is called synchronously from
// an ESLint rule visitor and from the CLI worker thread — neither can
// `await` a dynamic import. Bundling franc-min to a single CJS file here
// keeps the sync `require()` API while pulling in trigram-utils@2, which
// dropped the `trim` dependency that had the ReDoS CVE (GHSA-w5p7-h5w8-2hfq)
// pinning us to franc-min@5 was working around.
const esbuild = require('esbuild');

esbuild.buildSync({
  entryPoints: ['scripts/franc-min-entry.js'],
  outfile: 'lib/vendor/franc-min.cjs',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  minify: true,
});

console.log('Built lib/vendor/franc-min.cjs');
