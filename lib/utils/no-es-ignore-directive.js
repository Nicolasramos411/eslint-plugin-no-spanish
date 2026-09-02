'use strict';

// `eslint-disable(-next-line|-line)` already works for free when these
// rules run through ESLint's own engine — it doesn't need our help. This
// is the one directive ESLint doesn't know about: a package-specific
// comment that also works in the standalone CLI (which bypasses ESLint
// entirely and parses `eslint-disable` itself — see lib/cli/suppressions.js),
// so a suppression comment is portable between the two.
function hasIgnoreDirective(comments, line) {
  return comments.some((comment) => {
    const text = comment.value.trim();
    if (comment.loc.start.line === line && text === 'no-es-ignore-line') return true;
    if (comment.loc.start.line === line - 1 && text === 'no-es-ignore-next-line') return true;
    return false;
  });
}

module.exports = { hasIgnoreDirective };
