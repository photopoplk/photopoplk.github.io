#!/usr/bin/env node
/**
 * Session-start setup for Claude Code on the web (cloud sessions).
 *
 * Cloud sessions start from a fresh clone with no node_modules, so this
 * installs dependencies once, from package-lock.json, so `npm run build`
 * works straight away. On a local machine it does nothing: there you
 * install dependencies yourself with `npm install`.
 *
 * Run by the SessionStart hook in .claude/settings.json.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

if (process.env.CLAUDE_CODE_REMOTE !== 'true') process.exit(0);
if (existsSync(join(root, 'node_modules'))) process.exit(0);

console.error('cloud-setup: installing dependencies (npm ci)…');
const result = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], {
  cwd: root,
  stdio: ['ignore', 'ignore', 'inherit'],
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  console.error('cloud-setup: npm ci failed — run `npm ci` by hand to see why.');
}
// Never block the session from starting, even if the install failed.
process.exit(0);
