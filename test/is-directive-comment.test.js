'use strict';

const assert = require('assert');
const { isSpanish } = require('../lib/utils/detect-spanish');
const { isDirectiveComment } = require('../lib/utils/is-directive-comment');

describe('is-directive-comment', () => {
  it('recognizes eslint-disable/enable and no-es-ignore directives', () => {
    assert.strictEqual(isDirectiveComment('eslint-disable-next-line no-es/no-es-identifier'), true);
    assert.strictEqual(isDirectiveComment('eslint-disable-line'), true);
    assert.strictEqual(isDirectiveComment('eslint-disable import/no-extraneous-dependencies'), true);
    assert.strictEqual(isDirectiveComment('eslint-enable'), true);
    assert.strictEqual(isDirectiveComment('no-es-ignore-next-line'), true);
    assert.strictEqual(isDirectiveComment('no-es-ignore-line'), true);
  });

  it('does not match ordinary prose', () => {
    assert.strictEqual(isDirectiveComment('esto no es un eslint-disable'), false);
    assert.strictEqual(isDirectiveComment('borrar esto'), false);
  });

  it('documents why this exists: "no" and "es" are Spanish stopwords that live inside directive syntax', () => {
    assert.strictEqual(isSpanish('eslint-disable import/no-extraneous-dependencies'), true);
    assert.strictEqual(isSpanish('no-es-ignore-next-line'), true);
  });
});
