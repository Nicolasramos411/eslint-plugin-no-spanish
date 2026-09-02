'use strict';

const assert = require('assert');
const { Linter } = require('eslint');
const plugin = require('../lib/index');

describe('flat config (eslint.config.js)', () => {
  it('plugin.configs.recommended works when dropped straight into a flat config array', () => {
    const linter = new Linter({ configType: 'flat' });
    const messages = linter.verify(
      'const obtenerUsuario = () => {};',
      [plugin.configs.recommended],
      { filename: 'test.js' },
    );
    assert.strictEqual(messages.length, 1);
    assert.strictEqual(messages[0].ruleId, 'no-spanish/no-es-identifier');
  });

  it('rules can be referenced individually under any plugin key you choose', () => {
    const linter = new Linter({ configType: 'flat' });
    const config = [
      {
        plugins: { 'no-es': plugin },
        rules: {
          'no-es/no-es-comment': 'error',
          'no-es/no-es-identifier': 'warn',
        },
      },
    ];
    const messages = linter.verify(
      '// esto es un comentario bastante largo en español\nconst crearReporte = () => {};',
      config,
      { filename: 'test.js' },
    );
    const ruleIds = messages.map((m) => m.ruleId).sort();
    assert.deepStrictEqual(ruleIds, ['no-es/no-es-comment', 'no-es/no-es-identifier']);
  });
});
