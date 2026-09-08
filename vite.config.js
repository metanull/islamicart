import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { defineViewerConfig } from '@metanull/viewer-core/vite'

// The shared shape every website's vite.config.js needs — the data-package
// alias, the optimizeDeps split that keeps a single copy of Vue in dev, and
// the Vitest environment — now comes from viewer-core's own `./vite` entry
// (a plain-Node-safe module, separate from the `./testing` barrel that pulls
// in the Vue runtime), instead of being duplicated here by hand.
const viewerConfig = defineViewerConfig({
  dataPackage: '@metanull/islamicart-data',
  plugins: [vue()],
})

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  base: process.env.BASE_PATH ?? '/',
  ...viewerConfig,
  resolve: {
    ...viewerConfig.resolve,
    alias: {
      ...viewerConfig.resolve.alias,
      // `defineViewerConfig` (@metanull/viewer-core 1.13.1) builds this
      // alias from `import.meta.url` *inside its own source file*
      // (node_modules/@metanull/viewer-core/src/testing/viteConfig.js), so
      // it resolves to a path under viewer-core's own node_modules that
      // does not exist — every entity glob comes up empty and `npm test` /
      // `npm run build` both silently ship a site with no data. Reported
      // upstream (metanull/viewer-core#91); until it is fixed, this
      // website recomputes the same alias relative to its own
      // vite.config.js, the way the hand-written config did before
      // adopting the helper.
      '@inventory-data': fileURLToPath(
        new URL('./node_modules/@metanull/islamicart-data', import.meta.url),
      ),
    },
  },
})
