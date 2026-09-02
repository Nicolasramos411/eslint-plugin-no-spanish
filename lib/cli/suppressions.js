'use strict';

// The CLI bypasses ESLint entirely, so `eslint-disable` comments — which
// ESLint's own engine would normally honor — do nothing unless we parse
// them ourselves. Matching is alias-agnostic (checks the rule reference's
// *suffix*, e.g. "no-es-identifier", "no-es/no-es-identifier" and
// "some-alias/no-es-identifier" all match) because the prefix a user
// sees depends entirely on what they aliased the plugin to in their own
// config — this package can't control that, so it doesn't try to.
//
// `no-es-ignore-next-line` / `no-es-ignore-line` are a package-specific
// directive, understood the same way here and (unlike `eslint-disable`,
// which only makes sense when ESLint's engine is driving) also honored by
// the ESLint rules themselves — see `lib/rules/*.js` — so a suppression
// comment is portable between the ESLint rule and this CLI.
const RULE_SHORT_NAMES = ['no-es-comment', 'no-es-identifier'];

function matchesRule(ref, ruleShortName) {
  return ref === ruleShortName || ref.endsWith(`/${ruleShortName}`);
}

function parseRuleList(rest) {
  const withoutReason = (rest || '').split(/\s+--\s+/)[0].trim();
  if (!withoutReason) return []; // empty list means "all rules"
  return withoutReason.split(',').map((s) => s.trim()).filter(Boolean);
}

function coversRule(rules, ruleShortName) {
  return rules.length === 0 || rules.some((r) => matchesRule(r, ruleShortName));
}

/**
 * @param {{ text: string, line: number }[]} comments - every comment in the
 *   file (from extractComments), not just the ones flagged as Spanish —
 *   directive comments are themselves in English and must still be seen.
 * @returns {(line: number, ruleShortName: 'no-es-comment' | 'no-es-identifier') => boolean}
 */
function parseSuppressions(comments) {
  const disabledLines = new Set();
  const blockRanges = [];
  let openBlock = null;

  function disableLine(line, rules) {
    for (const short of RULE_SHORT_NAMES) {
      if (coversRule(rules, short)) disabledLines.add(`${line}:${short}`);
    }
  }

  for (const comment of comments) {
    const text = comment.text.trim();
    let match;

    if ((match = text.match(/^eslint-disable-next-line(?:\s+([\s\S]*))?$/))) {
      disableLine(comment.line + 1, parseRuleList(match[1]));
    } else if ((match = text.match(/^eslint-disable-line(?:\s+([\s\S]*))?$/))) {
      disableLine(comment.line, parseRuleList(match[1]));
    } else if (/^no-es-ignore-next-line$/.test(text)) {
      disableLine(comment.line + 1, []);
    } else if (/^no-es-ignore-line$/.test(text)) {
      disableLine(comment.line, []);
    } else if ((match = text.match(/^eslint-disable(?:\s+([\s\S]*))?$/))) {
      openBlock = { from: comment.line, rules: parseRuleList(match[1]) };
    } else if (/^eslint-enable(?:\s|$)/.test(text) && openBlock) {
      blockRanges.push({ ...openBlock, to: comment.line });
      openBlock = null;
    }
  }
  if (openBlock) blockRanges.push({ ...openBlock, to: Infinity });

  return function isSuppressed(line, ruleShortName) {
    if (disabledLines.has(`${line}:${ruleShortName}`)) return true;
    return blockRanges.some(({ from, to, rules }) => line >= from && line <= to && coversRule(rules, ruleShortName));
  };
}

module.exports = { parseSuppressions };
