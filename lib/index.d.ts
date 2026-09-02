// Deliberately does not import types from `eslint` (no `@types/eslint`
// dependency) — a consumer without that package installed would otherwise
// get a broken type resolution just from installing this plugin.

export interface NoEsCommentOptions {
  /** Minimum comment length before language detection kicks in. */
  minLength?: number;
  /** Minimum comment word count before language detection kicks in. */
  minWords?: number;
  /** Regex strings; comments matching any of these are skipped (e.g. TODO tags, URLs). */
  ignorePatterns?: string[];
}

export interface NoEsIdentifierOptions {
  /** Fraction of an identifier's words that must be Spanish to flag it. Default 0.5. */
  minRatio?: number;
  /** Exact identifier names to never flag (e.g. fiscal fields required by an external API). */
  ignoreNames?: string[];
  /** Extra Spanish words to add to the dictionary for your project's own vocabulary. */
  extraWords?: string[];
}

/** Minimal shape of an ESLint rule module — see the `eslint` package's own types for the full one. */
export interface NoEsRuleModule {
  meta: Record<string, unknown>;
  create: (context: unknown) => Record<string, unknown>;
}

/** Minimal shape of a flat ESLint config object (`eslint.config.js` entry). */
export interface NoEsFlatConfig {
  plugins: { 'no-es': NoEsPlugin };
  rules: Record<string, unknown>;
}

export interface NoEsPlugin {
  meta: { name: string; version: string };
  rules: {
    'no-es-comment': NoEsRuleModule;
    'no-es-identifier': NoEsRuleModule;
  };
  configs: {
    recommended: NoEsFlatConfig;
  };
}

declare const plugin: NoEsPlugin;
export default plugin;
