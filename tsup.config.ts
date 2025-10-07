import { defineConfig } from 'tsup'
import pkg from './package.json' with { type: 'json' }

export default defineConfig((_options) => [
  {
    entry: {
      index: 'src/sortedGlob.ts',
    },
    target: 'es2023',
    format: ['esm'],
    clean: true,
    dts: true,
    minify: false,
    sourcemap: true,
    splitting: true,
    treeshake: true,
    banner: { js: `\n// ${pkg.name} ${pkg.version}` },
  },
])
