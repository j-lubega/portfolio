import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default defineConfig(
  {
    ignores: ['dist/**', '.astro/**', '.vercel/**', 'node_modules/**', 'docs/baseline/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],
  {
    // React islands: accessibility rules for JSX. The jsx-a11y plugin object is
    // already registered by eslint-plugin-astro, so only the rules are applied here.
    files: ['**/*.tsx'],
    rules: jsxA11y.flatConfigs.recommended.rules,
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Client-side scripts inside .astro files and standalone browser scripts.
    files: ['src/scripts/**/*.{ts,js}', '**/*.astro/*.js', '**/*.astro/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Node scripts; the Playwright ones also run code inside the page (page.evaluate).
    files: ['scripts/**/*.mjs', '*.config.{js,mjs}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    // CommonJS Node scripts (require/module.exports/__dirname), run directly with `node`.
    files: ['scripts/**/*.cjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.commonjs },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  }
);
