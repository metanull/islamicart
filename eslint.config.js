import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

const globals = {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  process: 'readonly',
  URL: 'readonly',
}

export default [
  { ignores: ['dist/**'] },
  {
    ...js.configs.recommended,
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals,
    },
  },
  // The website's views are .vue files; without this block ESLint skips them
  // entirely ("no matching configuration"). 'essential' is the correctness
  // tier — the stricter presets only add formatting opinions.
  ...pluginVue.configs['flat/essential'].map((config) => ({
    ...config,
    files: ['**/*.vue'],
    languageOptions: {
      ...config.languageOptions,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals, ...(config.languageOptions?.globals ?? {}) },
    },
    rules: {
      // The Vue presets carry no base JS rules; without these, dead code in a
      // <script setup> block goes unreported.
      ...js.configs.recommended.rules,
      ...config.rules,
    },
  })),
  {
    files: ['src/views/**/*.vue'],
    rules: {
      // Route views are named after their page (Home, Database, Dynasties);
      // they are never used as tags, so the multi-word rule does not apply.
      'vue/multi-word-component-names': 'off',
    },
  },
]
