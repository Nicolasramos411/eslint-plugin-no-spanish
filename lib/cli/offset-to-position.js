'use strict';

/**
 * Precomputes newline byte offsets once per file so individual offset ->
 * {line, column} lookups (one per identifier found by SWC, whose spans
 * are byte offsets) are a binary search instead of a full rescan.
 *
 * Note: SWC spans are UTF-8 byte offsets while `src` is indexed in UTF-16
 * code units. This is only exact for ASCII source text; a file with
 * multi-byte characters before the offset can shift the reported column
 * slightly. Acceptable for a fast/advisory tool — the ESLint rule remains
 * the source of truth for exact positions.
 */
function buildLineIndex(src) {
  const newlineOffsets = [-1];
  for (let i = 0; i < src.length; i++) {
    if (src.charCodeAt(i) === 10) newlineOffsets.push(i);
  }
  return newlineOffsets;
}

function offsetToPosition(newlineOffsets, offset) {
  let lo = 0;
  let hi = newlineOffsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (newlineOffsets[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, column: offset - newlineOffsets[lo] - 1 };
}

module.exports = { buildLineIndex, offsetToPosition };
