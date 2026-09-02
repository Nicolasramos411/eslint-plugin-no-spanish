'use strict';

// franc-min@5 (CommonJS; 6+ is ESM-only and breaks `require()` on Node <20 —
// see the CI failure this pin fixed) exports the function directly, not as
// a named export.
const franc = require('franc-min');
// stopwords-iso/stopwords-es: community-maintained list of ~700 common
// Spanish function words (articles, pronouns, conjunctions...). Doing the
// generic-language part of this list this way, instead of hand-rolling it,
// is what makes the rule usable outside a single company's codebase.
const SPANISH_STOPWORDS_ISO = require('stopwords-es');

// Words that signal a Spanish *dev comment* specifically (TODOs, review
// notes) rather than general Spanish prose. Not really "stopwords", but
// they're short and common enough that they need the same fast-path
// treatment, so they live in the same set.
const DEV_SIGNAL_WORDS = [
  'funcion', 'función', 'variable', 'arreglo', 'objeto', 'clase',
  'revisar', 'agregar', 'cambiar', 'borrar', 'arreglar', 'pendiente',
];

const SPANISH_STOPWORDS = new Set([
  ...SPANISH_STOPWORDS_ISO.filter((w) => /^[a-záéíóúñü]+$/i.test(w)),
  ...DEV_SIGNAL_WORDS,
]);

// Characters that only show up in Spanish (or a handful of other Romance
// languages) — but plenty of otherwise-English comments legitimately
// contain one (an author's name, a borrowed word, a mentioned Spanish
// field/string), so this alone is not proof of a Spanish *comment*. It's
// only used as a fast path when combined with an actual stopword below.
const SPANISH_CHAR_PATTERN = /[ñÑ¿¡áéíóúÁÉÍÓÚüÜ]/;

const DEFAULT_MIN_LENGTH = 12;
const DEFAULT_MIN_WORDS = 3;
// franc's n-gram model needs a decent chunk of text to be reliable;
// below this length it guesses close to randomly, so we skip it and
// rely on the stopword ratio instead.
const FRANC_MIN_LENGTH = 40;

/**
 * Heuristically decides whether a comment's text is written in Spanish.
 *
 * @param {string} text - raw comment text (without // or /* markers)
 * @param {{ minLength?: number, minWords?: number }} [options]
 * @returns {boolean}
 */
function isSpanish(text, options = {}) {
  const minLength = options.minLength ?? DEFAULT_MIN_LENGTH;
  const minWords = options.minWords ?? DEFAULT_MIN_WORDS;

  const trimmed = text.trim();
  if (!trimmed) return false;

  const words = trimmed
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const stopwordHits = words.filter((w) => SPANISH_STOPWORDS.has(w)).length;

  // Fast path: tildes/ñ/inverted punctuation plus at least one real
  // Spanish stopword. Requiring both avoids flagging an English comment
  // that merely contains an accented name or borrowed word on its own
  // (e.g. "// Fix the café menu bug", "// @author Nicolás Ramos").
  if (SPANISH_CHAR_PATTERN.test(trimmed) && stopwordHits > 0) return true;

  if (words.length < minWords || trimmed.length < minLength) {
    // Too short to trust either stopwords or franc. Only flag it if it
    // is overwhelmingly made of Spanish stopwords (e.g. "// borrar esto").
    return words.length > 0 && stopwordHits === words.length && stopwordHits >= 2;
  }

  if (trimmed.length < FRANC_MIN_LENGTH) {
    // Medium-length comment: franc is unreliable here, use stopword ratio.
    return stopwordHits / words.length >= 0.34;
  }

  // Long enough for franc's n-gram model. Bias it toward only
  // distinguishing English vs Spanish so it doesn't get distracted
  // guessing e.g. Portuguese or Italian on short snippets.
  const guess = franc(trimmed, { only: ['eng', 'spa'], minLength: 10 });
  if (guess === 'spa') return true;
  if (guess === 'eng') return false;

  // franc returned 'und' (undetermined) - fall back to stopword ratio.
  return stopwordHits / words.length >= 0.34;
}

module.exports = { isSpanish, SPANISH_STOPWORDS, SPANISH_CHAR_PATTERN };
