'use strict';

const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-es-comment');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('no-es-comment', rule, {
  valid: [
    '// Gotta stick to English\nconst greeting = () => "Hello";',
    '// fix null pointer edge case on empty cart\nfunction f() {}',
    '// TODO(nicolas): revisit pagination',
    { code: '// arreglar esto pronto', options: [{ ignorePatterns: ['^arreglar'] }] },
    '// eslint-disable-next-line no-param-reassign',
    '// eslint-disable import/no-extraneous-dependencies',
    '// no-es-ignore-next-line\n// esto es un comentario bastante largo en español',
    '/* esto es un comentario bastante largo en español */ // no-es-ignore-line',
  ],
  invalid: [
    {
      code: '// Esto es un comentario bastante largo en español\nconst x = 1;',
      errors: [{ messageId: 'spanishComment' }],
    },
    {
      code: '// borrar esto',
      errors: [{ messageId: 'spanishComment' }],
    },
    {
      code: '// añadir validación aquí\nfunction f() {}',
      errors: [{ messageId: 'spanishComment' }],
    },
  ],
});

console.log('no-es-comment: all tests passed');
