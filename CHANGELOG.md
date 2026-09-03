# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.6] - 2026-09-03

### Changed

- Releases are now created automatically: pushing a `package.json`
  version bump to `main` creates the tag and GitHub Release (using this
  file's matching section as the release notes), which still triggers
  `npm stage publish` the same way a manually-created release did.

## [0.3.5] - 2026-09-03

### Changed

- Reworded the README, package description, and `no-es-comment`'s rule
  description: the goal is language consistency across the codebase, not
  prescribing English as the "correct" language.

## [0.3.4] - 2026-09-03

### Added

- Snyk "Known Vulnerabilities" badge and a Socket.dev report link in the README.

## [0.3.3] - 2026-09-03

### Security

- Fixed a high-severity ReDoS CVE (GHSA-w5p7-h5w8-2hfq, via `trim@0.0.1`) that
  reached production through `franc-min@5.0.0 > trigram-utils@1.0.3 > trim`.
  `franc-min` is now bundled to CJS at build time from `franc-min@6.2.0`
  (whose `trigram-utils@2` no longer depends on `trim`) instead of being a
  live `franc-min@5` runtime dependency — `franc-min@6+` is ESM-only, which
  can't be `require()`d synchronously from the ESLint rule visitor or the
  CLI worker thread.

## [0.3.2] - 2026-09-03

### Added

- npm version, downloads, CI status, and license badges in the README.

## [0.3.1] - 2026-09-03

### Changed

- Rewrote the README for clarity and dropped the internal "Publishing" section.

## [0.3.0] - 2026-09-03

### Added

- First public release under the unscoped `eslint-plugin-no-spanish` name.
- `no-es-comment` and `no-es-identifier` rules, plus the `no-es-check` standalone CLI.

### Fixed

- Pinned `franc-min` to v5 (CJS) to fix a CI failure on Node 18.

### Changed

- Renamed from the scoped `@nicolasramos41/eslint-plugin-no-es` to the unscoped `eslint-plugin-no-spanish`.
