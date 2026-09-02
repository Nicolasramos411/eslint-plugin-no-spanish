'use strict';

// eslint-disable / eslint-enable, plus this package's own no-es-ignore
// directives, are tooling syntax, not prose in either language, so they
// must never reach the Spanish-language heuristic. Two of the most common
// substrings in that syntax happen to double as common Spanish stopwords
// (a two-letter negation and a two-letter form of "to be"), which was
// enough to make a plain rule-disable comment, and even the ignore
// directive's own name, misread as Spanish text.
const DIRECTIVE_PATTERN = /^(eslint-(disable|enable|env)\b|no-es-ignore)/;

function isDirectiveComment(text) {
  return DIRECTIVE_PATTERN.test(text.trim());
}

module.exports = { isDirectiveComment };
