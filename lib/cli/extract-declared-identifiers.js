'use strict';

// Mirrors the node types the `no-es-identifier` ESLint rule checks:
// variable declarators, function/class names + params, class
// method/property keys, TS interface/type-alias/enum/namespace names,
// enum members, and catch-clause bindings. Kept as a plain recursive walk
// (not a visitor registered per node type) since we only care about a
// handful of types out of SWC's much larger set.

function walk(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, out);
    return;
  }

  switch (node.type) {
    case 'VariableDeclarator':
      pushIfIdentifier(node.id, out);
      break;
    case 'FunctionDeclaration':
    case 'FunctionExpression':
      pushIfIdentifier(node.identifier, out);
      (node.params || []).forEach((p) => pushParam(p, out));
      break;
    case 'ArrowFunctionExpression':
      (node.params || []).forEach((p) => pushParam(p, out));
      break;
    case 'ClassDeclaration':
    case 'ClassExpression':
      pushIfIdentifier(node.identifier, out);
      break;
    case 'ClassMethod':
    case 'PrivateMethod':
    case 'ClassProperty':
    case 'PrivateProperty':
      if (!node.computed) pushIfIdentifier(node.key, out);
      break;
    case 'TsInterfaceDeclaration':
    case 'TsTypeAliasDeclaration':
    case 'TsEnumDeclaration':
    case 'TsEnumMember':
    case 'TsModuleDeclaration':
      pushIfIdentifier(node.id, out);
      break;
    case 'CatchClause':
      pushIfIdentifier(node.param, out);
      break;
    default:
      break;
  }

  for (const key of Object.keys(node)) {
    if (key === 'span' || key === 'ctxt') continue;
    const value = node[key];
    if (value && typeof value === 'object') walk(value, out);
  }
}

function pushParam(param, out) {
  if (!param) return;
  if (param.type === 'Parameter') return pushParam(param.pat, out);
  if (param.type === 'Identifier') pushIfIdentifier(param, out);
  return undefined;
}

function pushIfIdentifier(node, out) {
  if (node && node.type === 'Identifier') {
    out.push({ name: node.value, start: node.span.start });
  }
}

/**
 * @param {import('@swc/core').Module} ast - from @swc/core's parseSync
 * @returns {{ name: string, start: number }[]}
 */
function extractDeclaredIdentifiers(ast) {
  const out = [];
  walk(ast.body, out);
  return out;
}

module.exports = { extractDeclaredIdentifiers };
