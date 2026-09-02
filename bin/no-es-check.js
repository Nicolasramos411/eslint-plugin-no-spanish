#!/usr/bin/env node
'use strict';

const path = require('path');
const { run } = require('../lib/cli/run');
const { DEFAULT_EXTENSIONS } = require('../lib/cli/find-files');
const { version } = require('../package.json');

const USAGE = `no-es-check [dir] [options]

Scans [dir] (default: .) for comments and identifiers written in Spanish.
Exits 1 if anything is found (or if a file failed to parse), 0 otherwise.

Options:
  --ext <list>              Comma-separated extensions to scan (default: ${DEFAULT_EXTENSIONS.join(',')})
  --extra-words <list>      Comma-separated extra Spanish words for the identifier dictionary
  --ignore-names <list>     Comma-separated exact identifier names to never flag
  --min-ratio <number>      Fraction of an identifier's words that must be Spanish to flag it
  --min-length <number>     Minimum comment length before language detection kicks in
  --min-words <number>      Minimum comment word count before language detection kicks in
  --ignore-patterns <list>  Comma-separated regexes; matching comments are skipped
  -h, --help                Show this help
  -v, --version             Show the installed version
`;

const LIST_FLAGS = {
  '--ext': 'ext',
  '--extra-words': 'extraWords',
  '--ignore-names': 'ignoreNames',
  '--ignore-patterns': 'ignorePatterns',
};
const NUMBER_FLAGS = {
  '--min-ratio': 'minRatio',
  '--min-length': 'minLength',
  '--min-words': 'minWords',
};

function parseArgs(argv) {
  const options = { dir: undefined, ext: undefined, extraWords: [], ignoreNames: [], ignorePatterns: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '-h' || arg === '--help') {
      process.stdout.write(USAGE);
      process.exit(0);
    }
    if (arg === '-v' || arg === '--version') {
      console.log(version);
      process.exit(0);
    }

    if (arg in LIST_FLAGS) {
      const value = argv[++i];
      if (value === undefined) failArg(`${arg} requires a value`);
      options[LIST_FLAGS[arg]] = value.split(',').map((s) => s.trim()).filter(Boolean);
      continue;
    }

    if (arg in NUMBER_FLAGS) {
      const raw = argv[++i];
      if (raw === undefined) failArg(`${arg} requires a value`);
      const num = Number(raw);
      if (Number.isNaN(num)) failArg(`${arg} expects a number, got "${raw}"`);
      options[NUMBER_FLAGS[arg]] = num;
      continue;
    }

    if (arg.startsWith('--')) failArg(`unknown option: ${arg}`);

    if (options.dir !== undefined) failArg(`unexpected extra argument: ${arg}`);
    options.dir = arg;
  }

  options.dir = options.dir ?? '.';
  return options;
}

function failArg(message) {
  console.error(`no-es-check: ${message}\n`);
  process.stderr.write(USAGE);
  process.exit(2);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { findings, errors, filesScanned, durationMs } = await run({
    dir: args.dir,
    extensions: args.ext,
    ruleOptions: {
      comment: {
        minLength: args.minLength,
        minWords: args.minWords,
        ignorePatterns: args.ignorePatterns,
      },
      identifier: {
        extraWords: args.extraWords,
        ignoreNames: args.ignoreNames,
        minRatio: args.minRatio,
      },
    },
  });

  for (const f of findings) {
    console.log(`${pathRelative(f.file)}:${f.line}:${f.column} [${f.rule}] ${f.message}`);
  }
  for (const e of errors) {
    console.error(`${pathRelative(e.file)}: ${e.message}`);
  }

  console.log(`\n${findings.length} issue(s) in ${filesScanned} file(s), ${durationMs}ms.`);
  if (errors.length) console.log(`${errors.length} file(s) failed to parse and were skipped for identifier checks.`);

  // A parse failure means the identifier check silently ran on fewer files
  // than requested — that should fail a pre-commit hook or CI job just
  // like a real finding would, not report a clean 0-issue pass.
  process.exit(findings.length > 0 || errors.length > 0 ? 1 : 0);
}

function pathRelative(file) {
  return path.relative(process.cwd(), file);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
