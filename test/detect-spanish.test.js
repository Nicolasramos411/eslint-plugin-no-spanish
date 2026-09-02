'use strict';

const assert = require('assert');
const { isSpanish } = require('../lib/utils/detect-spanish');

describe('detect-spanish: accented-character fast path', () => {
  it('does not flag English comments that merely contain an accented word', () => {
    const englishWithAccents = [
      'Fix the café menu rendering bug',
      '@author Nicolás Ramos',
      'Returns the año field from the legacy API response',
      'this comment is in perfectly good english but mentions España once',
    ];
    for (const text of englishWithAccents) {
      assert.strictEqual(isSpanish(text), false, `expected NOT Spanish: "${text}"`);
    }
  });

  it('still flags real Spanish text that happens to contain accents', () => {
    assert.strictEqual(isSpanish('añadir validación aquí'), true);
    assert.strictEqual(isSpanish('esto es un comentario bastante largo en español'), true);
  });
});
