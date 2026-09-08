import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The shared shape every website's vite.config.js should be is viewer-core's
// `defineViewerConfig()` (@metanull/viewer-core/testing) — but that barrel
// re-exports `mountSite` from `smoke.js`, which imports `createViewer.js`,
// which imports `AppRoot.vue` and the base stylesheet at module scope. A
// plain `vite.config.js` is loaded by Vite's own config loader in bare
// Node, outside any bundler transform, so that chain fails immediately with
// "Unknown file extension .vue" — reproduced with `node -e
// "import('@metanull/viewer-core/testing')"` directly, so it is not a Vite
// quirk. Until viewer-core's testing barrel stops pulling in the runtime
// eagerly (the fix belongs there, not here), this file keeps the shape
// `defineViewerConfig` would produce, by hand.
export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue()],
  resolve: {
    alias: {
      // viewer-core reads every JSON of the data package through this alias.
      '@inventory-data': fileURLToPath(
        new URL('./node_modules/@metanull/islamicart-data', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    // viewer-core ships .vue source that esbuild pre-bundling cannot parse;
    // viewer-layout must not be pre-bundled either or its chunk gets a second
    // copy of the Vue runtime in dev (both packages share the app's vue).
    // The /i18n subpath is listed as well as the package: Vite pre-bundles a
    // subpath as its own entry, and a second copy of the text module would be
    // a second, empty set of texts for whatever imported it.
    exclude: ['@metanull/viewer-core', '@metanull/viewer-core/i18n', '@metanull/viewer-layout'],
    // The runtime deps reach the browser through those excluded packages, so
    // the dev-server dependency scan cannot discover them from the excluded
    // code — only this website's own view imports currently make dev work.
    // Listing them explicitly pre-bundles each exactly once regardless of
    // what the app source happens to import; without it a late discovery
    // pre-bundles a second copy of Vue next to the raw one already loaded
    // and the dev server crashes on boot (seen on baroqueart).
    include: ['vue', 'vue-router'],
  },
  test: {
    environment: 'jsdom',
    testTimeout: 60000,
    server: {
      deps: {
        // viewer-core ships .vue source; Node cannot load it unless Vitest
        // processes the package instead of externalizing it. viewer-layout's
        // composed views import viewer-core, so the layout is processed too.
        inline: ['@metanull/viewer-core', '@metanull/viewer-layout'],
      },
    },
  },
})
