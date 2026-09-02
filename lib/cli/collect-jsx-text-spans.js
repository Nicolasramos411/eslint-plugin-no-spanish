'use strict';

// A regex-only comment scanner can't tell a JS string's apostrophe from an
// English contraction in JSX text ("Don't click") — both look identical
// lexically. Rather than guess, we ask SWC (already parsed for the
// identifier check) exactly where JSXText nodes are, so the comment
// masking step can neutralize quote characters *only* inside them.

function walk(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, out);
    return;
  }
  if (node.type === 'JSXText') {
    out.push({ start: node.span.start, end: node.span.end });
    return; // JSXText has no further children to recurse into
  }
  for (const key of Object.keys(node)) {
    if (key === 'span' || key === 'ctxt') continue;
    const value = node[key];
    if (value && typeof value === 'object') walk(value, out);
  }
}

/**
 * @param {import('@swc/core').Module} ast
 * @returns {{ start: number, end: number }[]} byte-offset spans of JSXText nodes
 */
function collectJsxTextSpans(ast) {
  const out = [];
  walk(ast.body, out);
  return out;
}

module.exports = { collectJsxTextSpans };
