import { defaultExternal, defineConfig } from './base-config.mjs';
import { build } from 'vite';
import chalk from 'chalk';

(async () => {
  const singleFileLibraries = [
    'events',
    'i18n',
    'styles',
    'thumbnail',
    'annotation-targets',
    'content-state',
    'painting-annotations',
    'ranges',
    'sequences',
    'fetch',
    // Vault.
    'vault',
    'vault-node',
    'vault-store',
    'vault-actions',
    'vault-utility',
  ];

  // Main UMD build.
  buildMsg('UMD + bundle');
  await build(
    defineConfig({
      entry: `src/index.ts`,
      name: 'index',
      outDir: 'dist',
      globalName: 'VaultHelpers',
      external: [],
    })
  );

  for (const singleFileLib of singleFileLibraries) {
    buildMsg(singleFileLib);
    let extraExternal = [];
    if (singleFileLib === 'vault-node') {
      extraExternal = ['node-fetch'];
    }

    await build(
      defineConfig({
        entry: `src/${singleFileLib}.ts`,
        name: singleFileLib,
        external: [...defaultExternal, ...extraExternal],
      })
    );
  }

  console.log('')


  function buildMsg(name) {
    console.log(chalk.grey(`\n\nBuilding ${chalk.blue(name)}\n`));
  }
})();
