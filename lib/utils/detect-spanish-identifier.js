'use strict';

const { splitIdentifier } = require('./split-identifier');
const { CORE_SPANISH_WORDS } = require('./spanish-words');

/**
 * Builds the dictionary once per rule run (not per identifier) from the
 * core word list plus any project-specific extra words.
 *
 * @param {{ extraWords?: string[] }} [options]
 * @returns {Set<string>}
 */
function buildSpanishDictionary(options = {}) {
  const dictionary = new Set(CORE_SPANISH_WORDS);
  for (const word of options.extraWords || []) dictionary.add(word.toLowerCase());
  return dictionary;
}

/**
 * @param {string} name - raw identifier name, e.g. "obtenerDatosUsuario"
 * @param {Set<string>} dictionary - from buildSpanishDictionary()
 * @param {{ minRatio?: number }} [options]
 * @returns {boolean}
 */
function isSpanishIdentifier(name, dictionary, options = {}) {
  const minRatio = options.minRatio ?? 0.5;
  const words = splitIdentifier(name);
  if (words.length === 0) return false;

  const hits = words.filter((w) => dictionary.has(w)).length;
  if (hits === 0) return false;

  // Single-word identifiers: require an exact dictionary hit (already
  // guaranteed above). Multi-word: require a minimum ratio so mixed
  // identifiers like "getUsuarioById" still trip it, but something like
  // "userTotalCount" (0 hits) never does.
  return hits / words.length >= minRatio;
}

module.exports = { isSpanishIdentifier, buildSpanishDictionary };
