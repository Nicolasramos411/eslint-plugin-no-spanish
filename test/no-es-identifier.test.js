'use strict';

const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-es-identifier');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('no-es-identifier', rule, {
  valid: [
    'const stickToEnglish = () => "Hello";',
    'function getUserById(userId) {}',
    'const totalCount = items.length;',
    { code: 'const rut = "11.111.111-1";', options: [{ ignoreNames: ['rut'] }] },
    'class OrderService {}',
    // niche/domain jargon stays out of the core dictionary unless added via extraWords
    'const boleta = getReceipt();',
  ],
  invalid: [
    {
      code: 'const obtenerUsuario = () => {};',
      errors: [{ messageId: 'spanishIdentifier' }],
    },
    {
      code: 'function crearReporte(usuario) {}',
      errors: [
        { messageId: 'spanishIdentifier' },
        { messageId: 'spanishIdentifier' },
      ],
    },
    {
      code: 'class ServicioDeUsuarios {}',
      errors: [{ messageId: 'spanishIdentifier' }],
    },
    {
      code: 'const calcularEnvio = () => {};',
      options: [{ extraWords: ['envio'] }],
      errors: [{ messageId: 'spanishIdentifier' }],
    },
    {
      code: 'const boleta = getReceipt();',
      options: [{ extraWords: ['boleta'] }],
      errors: [{ messageId: 'spanishIdentifier' }],
    },
  ],
});

ruleTester.run('no-es-identifier', rule, {
  valid: [
    '// eslint-disable-next-line no-es-identifier\nconst obtenerUsuario = () => {};',
    '// no-es-ignore-next-line\nconst obtenerUsuario = () => {};',
    'const obtenerUsuario = () => {}; // no-es-ignore-line',
  ],
  invalid: [],
});

// TS-only syntax (interface/type/enum/namespace) needs a TS-aware parser —
// espree (RuleTester's default) can't parse it at all.
const tsRuleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

tsRuleTester.run('no-es-identifier', rule, {
  valid: [
    'interface UserResponse { ok: boolean }',
    'enum OrderState { Pending }',
  ],
  invalid: [
    { code: 'interface Usuario { nombre: string }', errors: [{ messageId: 'spanishIdentifier' }] },
    { code: 'type RespuestaUsuario = { ok: boolean };', errors: [{ messageId: 'spanishIdentifier' }] },
    { code: 'enum EstadoPedido { Uno }', errors: [{ messageId: 'spanishIdentifier' }] },
    { code: 'namespace ServiciosDeUsuario { export const x = 1; }', errors: [{ messageId: 'spanishIdentifier' }] },
    { code: 'try {} catch (errorUsuario) {}', errors: [{ messageId: 'spanishIdentifier' }] },
  ],
});

console.log('no-es-identifier: all tests passed');
