'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_IGNORED_DIRS = new Set(['node_modules', '.git', '.next', '.turbo', 'dist', 'build', 'coverage']);
const DEFAULT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

/**
 * Recursively collects files matching `extensions` under `rootDir`,
 * skipping common build/dependency directories. Symlinked directories are
 * followed (common in monorepos, e.g. a pnpm workspace `src` symlink) but
 * guarded against cycles via each directory's real path; a symlink whose
 * target no longer exists is skipped rather than throwing. A side effect
 * of that same real-path guard: two different symlinked routes to the
 * same physical directory are only walked once, so a file reachable via
 * more than one apparent path is reported a single time, not once per path.
 *
 * @param {string} rootDir
 * @param {{ extensions?: string[], ignoredDirs?: Set<string> }} [options]
 * @returns {string[]} absolute file paths
 */
function findFiles(rootDir, options = {}) {
  const extensions = options.extensions || DEFAULT_EXTENSIONS;
  const ignoredDirs = options.ignoredDirs || DEFAULT_IGNORED_DIRS;
  const out = [];
  const visitedRealDirs = new Set();

  function walk(dir) {
    let realDir;
    try {
      realDir = fs.realpathSync(dir);
    } catch {
      return; // broken symlink target
    }
    if (visitedRealDirs.has(realDir)) return; // symlink cycle
    visitedRealDirs.add(realDir);

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      // dot-directories/files are almost always tooling state, not source
      // (.git, .next, .worktrees, .storybook-static...) — skip them all by
      // default rather than chasing every tool's directory name.
      if (entry.name.startsWith('.') || ignoredDirs.has(entry.name)) continue;

      const full = path.join(dir, entry.name);
      const isDir = entry.isSymbolicLink() ? statIsDirectory(full) : entry.isDirectory();
      if (isDir === null) continue; // broken symlink

      if (isDir) {
        walk(full);
      } else if (extensions.includes(path.extname(entry.name))) {
        out.push(full);
      }
    }
  }

  walk(rootDir);
  return out;
}

function statIsDirectory(fullPath) {
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return null;
  }
}

module.exports = { findFiles, DEFAULT_IGNORED_DIRS, DEFAULT_EXTENSIONS };
