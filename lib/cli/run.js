'use strict';

const os = require('os');
const path = require('path');
const { Worker } = require('worker_threads');
const { findFiles, DEFAULT_EXTENSIONS } = require('./find-files');

const WORKER_PATH = path.join(__dirname, 'worker.js');

/**
 * @param {{ dir?: string, extensions?: string[], ruleOptions?: { comment?: object, identifier?: object }, concurrency?: number }} [options]
 * @returns {Promise<{ findings: object[], errors: object[], filesScanned: number, durationMs: number }>}
 */
async function run(options = {}) {
  const dir = path.resolve(options.dir || '.');
  const extensions = options.extensions || DEFAULT_EXTENSIONS;
  const ruleOptions = options.ruleOptions || {};
  const concurrency = options.concurrency || os.cpus().length;

  const start = Date.now();
  const files = findFiles(dir, { extensions });

  const chunks = Array.from({ length: Math.min(concurrency, files.length) || 1 }, () => []);
  files.forEach((file, i) => chunks[i % chunks.length].push(file));

  const results = await Promise.all(chunks.map((chunk) => new Promise((resolve, reject) => {
    let settled = false;
    const worker = new Worker(WORKER_PATH, { workerData: { files: chunk, ruleOptions } });
    worker.on('message', (msg) => {
      settled = true;
      resolve(msg);
    });
    worker.on('error', (err) => {
      settled = true;
      reject(err);
    });
    // A worker that dies (OOM, killed by CI) without posting its result
    // message would otherwise hang this Promise.all forever.
    worker.on('exit', (code) => {
      if (!settled) reject(new Error(`no-es-check worker exited with code ${code} before reporting results`));
    });
  })));

  const findings = results.flatMap((r) => r.findings);
  const errors = results.flatMap((r) => r.errors);
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  return { findings, errors, filesScanned: files.length, durationMs: Date.now() - start };
}

module.exports = { run };
