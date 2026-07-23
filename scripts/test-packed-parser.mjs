import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
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
  const helpersBuildRoot = join(temporaryRoot, 'helpers');
  cpSync(root, helpersBuildRoot, {
    recursive: true,
    filter(source) {
      const topLevel = relative(root, source).split(sep)[0];
      return !['.git', 'dist', 'node_modules'].includes(topLevel);
    },
  });

  const helpersPackagePath = join(helpersBuildRoot, 'package.json');
  const helpersPackage = JSON.parse(readFileSync(helpersPackagePath, 'utf8'));
  helpersPackage.devDependencies['@iiif/parser'] = `file:${parserTarball}`;
  writeFileSync(helpersPackagePath, JSON.stringify(helpersPackage, null, 2));
  execFileSync(
    'pnpm',
    ['install', '--lockfile=false', '--config.auto-install-peers=true', '--strict-peer-dependencies'],
    { cwd: helpersBuildRoot, stdio: 'inherit' }
  );
  delete helpersPackage.devDependencies['@iiif/parser'];
  writeFileSync(helpersPackagePath, JSON.stringify(helpersPackage, null, 2));

  const helpersTarball = pack(helpersBuildRoot);
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
