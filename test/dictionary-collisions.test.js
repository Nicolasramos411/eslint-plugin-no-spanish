'use strict';

const assert = require('assert');
const englishWords = require('an-array-of-english-words');
const { CORE_SPANISH_WORDS } = require('../lib/utils/spanish-words');

// This guards the identifier dictionary against words that are also valid
// English identifiers — those cause false positives on any English
// codebase (e.g. we once shipped "roles", "total", "error", "color",
// "menu", "region", "subtotal", "valor", "registrar" here; all are
// common in real English variable names and had to come back out).
//
// A huge English wordlist also contains archaic/rare words that
// coincidentally match a useful Spanish word (e.g. "hora" is a rare
// English word for "hour" borrowed from Latin). Flagging every technical
// match would gut the dictionary for no real benefit, so matches here are
// reviewed once and added to REVIEWED_SAFE_OVERLAPS with a reason. Any
// *new*, unreviewed collision fails this test — that is the point: it
// forces a human decision before a risky word ships.
const REVIEWED_SAFE_OVERLAPS = new Set([
  'alto', 'ancho', // musical/print terms in English, not realistic JS identifiers
  'calcular', 'mover', // not real English words, false hit on a rare inflection
  'campo', 'campos', // surname/archaic English noun, not used in code
  'clave', // percussion instrument, not used in code
  'fila', 'tabla', 'ventana', // not standard English words
  'hora', 'horas', // archaic/poetic English for "hour", not used in code
  'mes', 'meses', // not standard English words
  'pais', // not a standard English word
  'solicitudes', // not a real English word (artifact of plural matching)
]);

const englishWordSet = new Set(englishWords);

function findUnreviewedCollisions(words) {
  return [...words].filter((w) => englishWordSet.has(w) && !REVIEWED_SAFE_OVERLAPS.has(w));
}

describe('dictionary collisions', () => {
  it('has no unreviewed English-word collisions in the core dictionary', () => {
    assert.deepStrictEqual(findUnreviewedCollisions(CORE_SPANISH_WORDS), []);
  });
});
