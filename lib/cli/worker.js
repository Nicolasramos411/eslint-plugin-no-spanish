'use strict';

const fs = require('fs');
const { parentPort, workerData } = require('worker_threads');
const { isSpanish } = require('../utils/detect-spanish');
const { isSpanishIdentifier, buildSpanishDictionary } = require('../utils/detect-spanish-identifier');
const { extractComments } = require('./extract-comments');
const { extractDeclaredIdentifiers } = require('./extract-declared-identifiers');
const { collectJsxTextSpans } = require('./collect-jsx-text-spans');
const { maskJsxTextQuotes } = require('./mask-jsx-text-quotes');
const { parseSuppressions } = require('./suppressions');
const { isDirectiveComment } = require('../utils/is-directive-comment');
const { buildLineIndex, offsetToPosition } = require('./offset-to-position');

let swc;
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  swc = require('@swc/core');
} catch {
  swc = null;
}

const { files, ruleOptions } = workerData;
const dictionary = buildSpanishDictionary(ruleOptions.identifier || {});
const ignoreNames = new Set((ruleOptions.identifier || {}).ignoreNames || []);
const findings = [];
const errors = [];

for (const file of files) {
  let src;
  try {
    src = fs.readFileSync(file, 'utf8');
  } catch (err) {
    errors.push({ file, message: err.message });
    continue;
  }

  let ast = null;
  if (swc) {
    try {
      const isTsx = file.endsWith('.tsx') || file.endsWith('.jsx');
      ast = swc.parseSync(src, { syntax: 'typescript', tsx: isTsx, decorators: true });
    } catch (err) {
      errors.push({ file, message: `parse error: ${err.message}` });
    }
  }

  // A pure regex comment scan can't tell a JS string's apostrophe from an
  // English contraction in JSX text ("Don't click"), and over-matches to
  // the next real quote in the file. When we have a real parse, mask
  // quote characters inside JSXText spans first so that trap doesn't
  // apply. Without a parse (no @swc/core, or this file failed to parse)
  // we fall back to the plain regex scan, apostrophe trap and all.
  const commentSrc = ast ? maskJsxTextQuotes(src, collectJsxTextSpans(ast)) : src;
  const comments = extractComments(commentSrc);
  const isSuppressed = parseSuppressions(comments);

  for (const comment of comments) {
    if (!comment.text) continue;
    if (isDirectiveComment(comment.text)) continue;
    if (isSuppressed(comment.line, 'no-es-comment')) continue;
    if (isSpanish(comment.text, ruleOptions.comment || {})) {
      findings.push({
        file, line: comment.line, column: comment.column + 1, rule: 'no-es-comment',
        message: `Comments must be written in English, not Spanish: "${comment.text.slice(0, 60)}"`,
      });
    }
  }

  if (!ast) continue; // identifier check needs a real parse

  const lineIndex = buildLineIndex(src);
  for (const { name, start } of extractDeclaredIdentifiers(ast)) {
    if (ignoreNames.has(name)) continue;
    if (!isSpanishIdentifier(name, dictionary, ruleOptions.identifier || {})) continue;
    const { line, column } = offsetToPosition(lineIndex, start - 1);
    if (isSuppressed(line, 'no-es-identifier')) continue;
    findings.push({
      file, line, column: column + 1, rule: 'no-es-identifier',
      message: `"${name}" looks like it is named in Spanish. Use an English name instead.`,
    });
  }
}

parentPort.postMessage({ findings, errors });
