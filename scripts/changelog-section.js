'use strict';

// Prints the CHANGELOG.md section for the current package.json version, so
// the release workflow can use it as GitHub Release notes without
// duplicating them.
const fs = require('fs');
const path = require('path');

const { version } = require('../package.json');
const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
const lines = changelog.split('\n');

const startIndex = lines.findIndex((line) => line.startsWith(`## [${version}]`));
if (startIndex === -1) {
  console.error(`No CHANGELOG.md section found for version ${version}`);
  process.exit(1);
}

let endIndex = lines.findIndex((line, i) => i > startIndex && line.startsWith('## ['));
if (endIndex === -1) endIndex = lines.length;

console.log(lines.slice(startIndex + 1, endIndex).join('\n').trim());
