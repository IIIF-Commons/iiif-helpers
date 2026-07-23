import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const parserRoot = resolve(process.env.IIIF_PARSER_DIR || join(root, '..', 'parser'));
const testFile = join(root, '__tests__', 'presentation-4', 'packed-package.mjs');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'iiif-packed-integration-'));

function pack(packageRoot) {
  const existingTarballs = new Set(readdirSync(temporaryRoot));
  execFileSync('pnpm', ['pack', '--pack-destination', temporaryRoot], {
    cwd: packageRoot,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const tarball = readdirSync(temporaryRoot).find((file) => file.endsWith('.tgz') && !existingTarballs.has(file));
  if (!tarball) throw new Error(`pnpm did not pack ${packageRoot}`);
  return join(temporaryRoot, tarball);
}

try {
  const parserPackage = JSON.parse(readFileSync(join(parserRoot, 'package.json'), 'utf8'));
  if (parserPackage.name !== '@iiif/parser') {
    throw new Error(`${parserRoot} is not the @iiif/parser package`);
  }

  const parserTarball = pack(parserRoot);
  const helpersTarball = pack(root);
  writeFileSync(
    join(temporaryRoot, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies: {
        '@iiif/helpers': `file:${helpersTarball}`,
        '@iiif/parser': `file:${parserTarball}`,
      },
    })
  );
  copyFileSync(testFile, join(temporaryRoot, 'packed-package.mjs'));

  execFileSync(
    'pnpm',
    ['install', '--ignore-scripts', '--config.auto-install-peers=false', '--strict-peer-dependencies'],
    { cwd: temporaryRoot, stdio: 'inherit' }
  );
  execFileSync(process.execPath, ['packed-package.mjs'], {
    cwd: temporaryRoot,
    stdio: 'inherit',
  });
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
