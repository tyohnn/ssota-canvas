import { nextJsConfig } from '@workspace/eslint-config/next-js';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/no-array-constructor': 'warn',
      '@typescript-eslint/no-duplicate-enum-values': 'warn',
      '@typescript-eslint/no-extra-non-null-assertion': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off', // Too many warnings
      '@typescript-eslint/no-misused-new': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
      '@typescript-eslint/no-unsafe-declaration-merging': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-includes': 'off',
      '@typescript-eslint/prefer-literal-enum-member': 'warn',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/prefer-reduce-type-parameter': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/prefer-ts-expect-error': 'off', // Allow @ts-ignore
      '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-ignore and @ts-nocheck
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty interfaces

      // JavaScript rules
      'prefer-const': 'off', // Too many warnings
      'no-useless-escape': 'off', // Regex patterns
      'no-case-declarations': 'off', // Switch case declarations
      'no-empty': 'off', // Empty catch blocks
      'no-useless-catch': 'off', // Catch and rethrow

      // React rules
      'react-hooks/rules-of-hooks': 'off', // Allow conditional hooks in some cases
      'react-hooks/exhaustive-deps': 'off', // Too many warnings
      'react/no-unescaped-entities': 'off', // Allow quotes in JSX
      'react/no-unknown-property': 'off', // Allow custom properties
      'react/no-array-index-key': 'off', // Allow array index as key

      // Next.js rules
      '@next/next/no-img-element': 'off', // Allow img tags
    },
  },
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
];
