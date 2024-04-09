// Exports:
// "."
// "./events"
// "./i18n"
// "./styles"
// "./thumbnail"
// "./annotation-targets"
// "./content-state"
// "./fetch"
// "./painting-annotations"
// "./ranges"
// "./sequences"
// "./vault"
// "./vault-node"
// "./vault/global-vault"
// "./vault/actions"
// "./vault/store"
// "./vault/utility"
import { defineConfig, type Options } from 'tsup';

export default defineConfig((options: Options) => ({
  dts: true,
  target: ['es2020'],
  format: ['esm', 'cjs', 'iife'],
  platform: 'browser',
  entry: {
    index: 'src/index.ts',
    events: 'src/events.ts',
    i18n: 'src/i18n.ts',
    styles: 'src/styles.ts',
    thumbnail: 'src/thumbnail.ts',
    'annotation-targets': 'src/annotation-targets.ts',
    'content-state': 'src/content-state.ts',
    fetch: 'src/fetch.ts',
    'painting-annotations': 'src/painting-annotations.ts',
    ranges: 'src/ranges.ts',
    sequences: 'src/sequences.ts',
    vault: 'src/vault.ts',
    'vault-node': 'src/vault-node.ts',
    'vault-store': 'src/vault-store.ts',
    'vault-actions': 'src/vault-actions.ts',
    'vault-utility': 'src/vault-utility.ts',
  },
  minify: false,
  external: [],
  globalName: 'IIIFHelpers',
  ...options,
}));
