'use strict';

// Matches a single/double-quoted string, a template literal, or a
// line/block comment. Order matters: strings and templates are tried
// first so their contents never get misread as comment delimiters.
const TOKEN_RE = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

/**
 * Extracts comment text (without the `//`/`/* *\/` markers) and its
 * line/column from source, without building a full AST. Strings and
 * template literals are skipped so their contents can't be mistaken for
 * comment delimiters — this is the one correctness trap of a regex-only
 * approach, so it gets handled explicitly rather than ignored.
 *
 * @param {string} src
 * @returns {{ text: string, line: number, column: number }[]}
 */
function extractComments(src) {
  const comments = [];
  // Matches are found in increasing index order, so line/column can be
  // tracked incrementally from the last match instead of rescanning the
  // whole prefix on every comment (matters on large files with many
  // comments).
  let line = 1;
  let lastNewline = -1;
  let scannedUpTo = 0;

  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = TOKEN_RE.exec(src))) {
    for (let i = scannedUpTo; i < match.index; i++) {
      if (src.charCodeAt(i) === 10) {
        line++;
        lastNewline = i;
      }
    }
    scannedUpTo = match.index;

    const token = match[0];
    if (token[0] === "'" || token[0] === '"' || token[0] === '`') continue;

    const isBlock = token.startsWith('/*');
    const text = isBlock ? token.slice(2, -2) : token.slice(2);
    comments.push({ text: text.trim(), line, column: match.index - lastNewline - 1 });
  }
  return comments;
}

module.exports = { extractComments };
