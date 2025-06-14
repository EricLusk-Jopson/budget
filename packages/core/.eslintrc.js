module.exports = {
  extends: ["@budget/eslint-config"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  // Override for test files to use the test tsconfig
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.spec.ts"],
      parserOptions: {
        project: "./tsconfig.test.json",
        tsconfigRootDir: __dirname,
      },
    },
  ],
};
