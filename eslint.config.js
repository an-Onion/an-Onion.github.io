import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '*.d.ts',
      '*.js',
    ],
  },
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tseslintParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
  },
];
