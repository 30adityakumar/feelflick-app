import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  // ── Global ignores ────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/',
      'node_modules/',
      'scripts/',
      'find-unused-files.js',
      'check-status.sh',
      'coverage/',
    ],
  },

  // ── Base JS rules ─────────────────────────────────────────────────────────
  js.configs.recommended,

  // ── React + Hooks + a11y ──────────────────────────────────────────────────
  {
    files: ['src/**/*.{js,jsx}'],

    plugins: {
      react: reactPlugin,
      // react-hooks v7 ships React Compiler rules; register the plugin manually
      // and only enable the two classic rules (project is React 18, no Compiler).
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11y,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },

    settings: {
      react: { version: '18' },
    },

    rules: {
      // ── React ──────────────────────────────────────────────────────────────
      ...reactPlugin.configs.flat.recommended.rules,
      // New JSX transform (React 17+): no need to import React in scope
      'react/react-in-jsx-scope': 'off',
      // JavaScript project — PropTypes not enforced (future: migrate to TS)
      'react/prop-types': 'off',
      // Display names help debugging but are optional in a JSX-heavy codebase
      'react/display-name': 'warn',
      // Catch keys missing in lists
      'react/jsx-key': 'error',
      // Prevent passing children as props
      'react/no-children-prop': 'error',
      // No danger without sanitization
      'react/no-danger': 'warn',

      // ── React Hooks (classic two — skip React Compiler rules) ──────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── Accessibility ──────────────────────────────────────────────────────
      // Spread recommended a11y rules as warnings — lets us see the full scope
      // before promoting any to errors.
      ...Object.fromEntries(
        Object.entries(jsxA11y.flatConfigs.recommended.rules).map(
          ([rule, config]) => [rule, config === 'error' ? 'warn' : config]
        )
      ),

      // ── General JS ────────────────────────────────────────────────────────
      // Warn on unused vars; prefix with _ to suppress (e.g. _unused)
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      // Allow console.warn / console.error in production paths; warn on .log
      'no-console': ['warn', { allow: ['warn', 'error', 'group', 'groupEnd', 'groupCollapsed'] }],
      // Catch typos in conditions
      'no-constant-condition': 'warn',
      // Prevent accidentally double-declared vars
      'no-redeclare': 'error',
      // Catch use before define (functions are fine due to hoisting)
      'no-use-before-define': ['warn', { functions: false, classes: true, variables: true }],
    },
  },

  // ── Test files — relax a handful of rules ─────────────────────────────────
  {
    files: ['src/**/__tests__/**/*.{js,jsx}', 'src/**/*.test.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        // Vitest globals (describe, it, expect, vi, etc.)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'warn',
    },
  },
]
