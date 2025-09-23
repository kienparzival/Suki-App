import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import localI18n from './scripts/eslint-no-hardcoded-ui.js'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'local-i18n': localI18n
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        Canvas: 'readonly',
        CanvasRenderingContext2D: 'readonly'
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'local-i18n/no-hardcoded-ui': 'warn', // Changed to warn for now
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'react/jsx-no-target-blank': 'warn',
      'react/no-unescaped-entities': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]
