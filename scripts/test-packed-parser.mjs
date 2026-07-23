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

function publicSpecifiers(packageName, packageJson) {
  return Object.keys(packageJson.exports || {})
    .filter((subpath) => !subpath.includes('*'))
    .map((subpath) => (subpath === '.' ? packageName : `${packageName}${subpath.slice(1)}`));
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
  const allPublicSpecifiers = [
    ...publicSpecifiers('@iiif/parser', parserPackage),
    ...publicSpecifiers('@iiif/helpers', helpersPackage),
  ];
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
  writeFileSync(
    join(temporaryRoot, 'public-subpaths.json'),
    JSON.stringify(allPublicSpecifiers, null, 2)
  );

  execFileSync(
    'pnpm',
    ['install', '--offline', '--ignore-scripts', '--config.auto-install-peers=false', '--strict-peer-dependencies'],
    { cwd: temporaryRoot, stdio: 'inherit' }
  );
  execFileSync(process.execPath, ['packed-package.mjs'], {
    cwd: temporaryRoot,
    stdio: 'inherit',
  });

  const typeConsumer = allPublicSpecifiers
    .map((specifier, index) => `import * as publicModule${index} from ${JSON.stringify(specifier)};\nvoid publicModule${index};`)
    .join('\n');
  writeFileSync(join(temporaryRoot, 'consumer.ts'), typeConsumer);

  for (const [name, compilerOptions] of [
    [
      'nodenext',
      {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
      },
    ],
    [
      'bundler',
      {
        module: 'ESNext',
        moduleResolution: 'Bundler',
      },
    ],
  ]) {
    const configPath = join(temporaryRoot, `tsconfig.${name}.json`);
    writeFileSync(
      configPath,
      JSON.stringify({
        compilerOptions: {
          ...compilerOptions,
          target: 'ES2022',
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        files: ['./consumer.ts'],
      })
    );
    execFileSync('pnpm', ['exec', 'tsc', '--project', configPath], {
      cwd: root,
      stdio: 'inherit',
    });
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
