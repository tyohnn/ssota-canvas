import { nextJsConfig } from "@workspace/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/require-await": "off", // Requires type information
      "@typescript-eslint/no-floating-promises": "off", // Requires type information
      "@typescript-eslint/await-thenable": "off", // Requires type information
      "@typescript-eslint/no-misused-promises": "off", // Requires type information
      "@typescript-eslint/prefer-nullish-coalescing": "off", // Requires type information
      "@typescript-eslint/prefer-optional-chain": "off", // Requires type information
      "@typescript-eslint/no-unnecessary-condition": "off", // Requires type information
      "@typescript-eslint/no-unnecessary-type-assertion": "off", // Requires type information
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-array-constructor": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-extra-non-null-assertion": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
      "@typescript-eslint/no-this-alias": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",
      "@typescript-eslint/no-unsafe-declaration-merging": "error",
      "@typescript-eslint/prefer-function-type": "error",
      "@typescript-eslint/prefer-includes": "off", // Requires type information
      "@typescript-eslint/prefer-literal-enum-member": "error",
      "@typescript-eslint/prefer-readonly": "off", // Requires type information
      "@typescript-eslint/prefer-readonly-parameter-types": "off", // Too strict for React
      "@typescript-eslint/prefer-reduce-type-parameter": "off", // Requires type information
      "@typescript-eslint/prefer-string-starts-ends-with": "off", // Requires type information
      "@typescript-eslint/prefer-ts-expect-error": "error",
      "@typescript-eslint/unbound-method": "off", // Requires type information
      "@typescript-eslint/unified-signatures": "error",
    },
  },
  {
    files: ["**/__tests__/**/*", "**/*.test.*", "**/*.spec.*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
];
