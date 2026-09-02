'use strict';

const { isSpanishIdentifier, buildSpanishDictionary } = require('../utils/detect-spanish-identifier');
const { hasIgnoreDirective } = require('../utils/no-es-ignore-directive');

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow variable, function, class, interface, type, enum and namespace names written in Spanish',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          minRatio: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Minimum ratio of Spanish words within the identifier to flag it.',
          },
          ignoreNames: {
            type: 'array',
            items: { type: 'string' },
            description: 'Exact identifier names to never flag (e.g. fiscal fields required by SII/SAT/DIAN APIs: rut, folio, dte).',
          },
          extraWords: {
            type: 'array',
            items: { type: 'string' },
            description: "Extra Spanish words to add to the dictionary for your project's own domain vocabulary.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      spanishIdentifier: '"{{ name }}" looks like it is named in Spanish. Use an English name instead.',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const ignoreNames = new Set(options.ignoreNames || []);
    const dictionary = buildSpanishDictionary(options);

    function check(idNode) {
      if (!idNode || idNode.type !== 'Identifier') return;
      const { name } = idNode;
      if (ignoreNames.has(name)) return;
      if (!isSpanishIdentifier(name, dictionary, options)) return;
      const sourceCode = context.getSourceCode();
      if (hasIgnoreDirective(sourceCode.getAllComments(), idNode.loc.start.line)) return;
      context.report({
        node: idNode,
        messageId: 'spanishIdentifier',
        data: { name },
      });
    }

    return {
      VariableDeclarator(node) {
        check(node.id);
      },
      FunctionDeclaration(node) {
        check(node.id);
        node.params.forEach(check);
      },
      FunctionExpression(node) {
        check(node.id);
        node.params.forEach(check);
      },
      ArrowFunctionExpression(node) {
        node.params.forEach(check);
      },
      ClassDeclaration(node) {
        check(node.id);
      },
      MethodDefinition(node) {
        if (!node.computed) check(node.key);
      },
      PropertyDefinition(node) {
        if (!node.computed) check(node.key);
      },
      TSInterfaceDeclaration(node) {
        check(node.id);
      },
      TSTypeAliasDeclaration(node) {
        check(node.id);
      },
      TSEnumDeclaration(node) {
        check(node.id);
      },
      TSEnumMember(node) {
        check(node.id);
      },
      TSModuleDeclaration(node) {
        check(node.id);
      },
      CatchClause(node) {
        check(node.param);
      },
    };
  },
};
