'use strict';

const { isSpanish } = require('../utils/detect-spanish');
const { hasIgnoreDirective } = require('../utils/no-es-ignore-directive');
const { isDirectiveComment } = require('../utils/is-directive-comment');

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow comments written in Spanish; require English',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          minLength: {
            type: 'integer',
            minimum: 1,
            description: 'Minimum comment length before language detection kicks in.',
          },
          minWords: {
            type: 'integer',
            minimum: 1,
            description: 'Minimum word count before language detection kicks in.',
          },
          ignorePatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Regex strings; comments matching any of these are skipped (e.g. TODO tags, URLs).',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      spanishComment: 'Comments must be written in English, not Spanish: "{{ text }}"',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const ignorePatterns = (options.ignorePatterns || []).map((p) => new RegExp(p));

    return {
      Program() {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          const text = comment.value.trim();
          if (!text) continue;
          if (isDirectiveComment(text)) continue;
          if (ignorePatterns.some((re) => re.test(text))) continue;

          if (isSpanish(text, options) && !hasIgnoreDirective(comments, comment.loc.start.line)) {
            context.report({
              loc: comment.loc,
              messageId: 'spanishComment',
              data: {
                text: text.length > 60 ? `${text.slice(0, 57)}...` : text,
              },
            });
          }
        }
      },
    };
  },
};
