'use strict';

/**
 * Returns a same-length copy of `src` with `'`, `"` and `` ` `` replaced by
 * a space inside the given JSXText spans, so the comment-extraction regex
 * can no longer mistake an English contraction ("Don't click") for the
 * start of a string literal. Everything outside those spans — including
 * real comments — is left untouched, and line/column math stays correct
 * because the output has the exact same length as the input.
 *
 * @param {string} src
 * @param {{ start: number, end: number }[]} jsxTextSpans - byte offsets from SWC
 * @returns {string}
 */
function maskJsxTextQuotes(src, jsxTextSpans) {
  if (jsxTextSpans.length === 0) return src;

  // UTF-16 code units, consistent with how offset-to-position.js indexes
  // `src` elsewhere — not a code-point split, to keep the two in sync.
  const chars = src.split('');
  for (const { start, end } of jsxTextSpans) {
    // SWC spans are 1-based byte offsets; approximate as UTF-16 code unit
    // indices (exact for ASCII, which covers the quote characters we mask).
    for (let i = Math.max(0, start - 1); i < Math.min(chars.length, end - 1); i++) {
      if (chars[i] === "'" || chars[i] === '"' || chars[i] === '`') chars[i] = ' ';
    }
  }
  return chars.join('');
}

module.exports = { maskJsxTextQuotes };
