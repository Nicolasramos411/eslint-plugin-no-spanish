'use strict';

const assert = require('assert');
const { splitIdentifier } = require('../lib/utils/split-identifier');

describe('splitIdentifier', () => {
  it('splits camelCase and acronym transitions', () => {
    assert.deepStrictEqual(splitIdentifier('obtenerDatosDeUsuario'), ['obtener', 'datos', 'de', 'usuario']);
    assert.deepStrictEqual(splitIdentifier('HTTPServerUsuario'), ['http', 'server', 'usuario']);
    assert.deepStrictEqual(splitIdentifier('crear_boleta_v2'), ['crear', 'boleta']);
  });

  it('splits on an accented capital letter, not just [A-Z]', () => {
    assert.deepStrictEqual(splitIdentifier('calcularÁrea'), ['calcular', 'área']);
    assert.deepStrictEqual(splitIdentifier('mostrarÚltimo'), ['mostrar', 'último']);
    assert.deepStrictEqual(splitIdentifier('getÍndice'), ['get', 'índice']);
  });

  it('treats a leading sigil as a separator', () => {
    assert.deepStrictEqual(splitIdentifier('$usuario'), ['usuario']);
  });

  it('does not exhibit catastrophic backtracking on a long uppercase run', () => {
    const start = Date.now();
    splitIdentifier('A'.repeat(200000));
    assert.ok(Date.now() - start < 1000, 'splitIdentifier took over 1s on a long uppercase run');
  });
});
