'use strict';

const noEsComment = require('./rules/no-es-comment');
const noEsIdentifier = require('./rules/no-es-identifier');

const plugin = {
  meta: {
    name: 'eslint-plugin-no-spanish',
    version: require('../package.json').version,
  },
  rules: {
    'no-es-comment': noEsComment,
    'no-es-identifier': noEsIdentifier,
  },
  configs: {},
};

// Flat config (eslint.config.js) preset. Key matches the short name ESLint
// auto-derives from the package name in legacy (.eslintrc.json) config —
// see the README — so both config styles use the same "no-spanish/..." rule IDs.
plugin.configs.recommended = {
  plugins: { 'no-spanish': plugin },
  rules: {
    'no-spanish/no-es-comment': 'warn',
    'no-spanish/no-es-identifier': 'warn',
  },
};

module.exports = plugin;
