'use strict';

/**
 * Splits an identifier like `obtenerDatosDeUsuario` or `crear_boleta_v2`
 * into lowercase words: ['obtener', 'datos', 'de', 'usuario'].
 * Numbers and single-letter runs (like acronyms) are dropped.
 *
 * @param {string} name
 * @returns {string[]}
 */
function splitIdentifier(name) {
  return name
    // insert boundaries before an uppercase letter that follows a lowercase
    // or digit: obtenerDatos -> obtener Datos. Unicode letter classes (not
    // [a-z]/[A-Z]) so accented capitals split too: calcularÁrea -> calcular Área.
    .replace(/(?<=\p{Ll}|\p{Nd})(?=\p{Lu})/gu, ' ')
    // insert boundaries inside acronym->word transitions: HTTPServer -> HTTP Server.
    // Zero-width lookaround, not a captured `\p{Lu}+` run followed by a
    // required suffix — that shape is quadratic (catastrophic backtracking)
    // on a long run of uppercase letters with no lowercase letter after it.
    .replace(/(?<=\p{Lu})(?=\p{Lu}\p{Ll})/gu, ' ')
    // snake_case / kebab-case / digits / a leading sigil as separators
    .replace(/[_\-$0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => w.toLowerCase());
}

module.exports = { splitIdentifier };
