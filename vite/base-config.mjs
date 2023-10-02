import react from '@vitejs/plugin-react';

export const defaultExternal = [
  '@iiif/parser',
  '@atlas-viewer/iiif-image-api',
  'redux',
  'typesafe-actions',
];

/**
 * @param options {{ external: string[]; entry: string; name: string; globalName: string; outDir?: string; react?: boolean }}
 */
export function defineConfig(options) {
  return {
    build: {
      sourcemap: true,
      outDir: options.outDir || `dist/${options.name}`,
      lib: {
        entry: options.entry,
        name: options.globalName,
        formats: options.globalName ? ['es', 'cjs', 'umd'] : ['es', 'cjs'],
        fileName: (format) => {
          if (format === 'umd') {
            return `index.umd.js`;
          }
          if (format === 'es') {
            return `esm/${options.name}.mjs`;
          }
          return `${format}/${options.name}.js`;
        },
      },
      plugins: [
        options.react ? react({}) : false,
      ].filter(Boolean),
      rollupOptions: {
        external: options.external,
        output: {
          globals: {
            // If any..
          },
        },
      },
    },
  };
}
