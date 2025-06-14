module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    // Basic ESLint rules
    "no-unused-vars": "off",
    "no-var": "error",
    "prefer-const": "error",

    // TypeScript rules (less strict for development)
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "warn", // Changed from error to warn
    "@typescript-eslint/prefer-optional-chain": "warn", // Changed from error to warn
    "@typescript-eslint/ban-ts-comment": "warn",
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**/*.ts"],
      parserOptions: {
        project: "./tsconfig.test.json",
        tsconfigRootDir: __dirname,
      },
      env: {
        jest: true,
      },
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        test: "readonly",
        jest: "readonly",
      },
      rules: {
        // Relax rules for test files
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
  ignorePatterns: ["dist", "node_modules", "build"],
};
