'use strict';

const noEsComment = require('./rules/no-es-comment');
const noEsIdentifier = require('./rules/no-es-identifier');

const plugin = {
  meta: {
    name: 'eslint-plugin-no-es',
    version: require('../package.json').version,
  },
  rules: {
    'no-es-comment': noEsComment,
    'no-es-identifier': noEsIdentifier,
  },
  configs: {},
};

// Flat config (eslint.config.js) preset
plugin.configs.recommended = {
  plugins: { 'no-es': plugin },
  rules: {
    'no-es/no-es-comment': 'warn',
    'no-es/no-es-identifier': 'warn',
  },
};

module.exports = plugin;
