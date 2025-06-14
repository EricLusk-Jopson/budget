const baseConfig = require("@budget/jest-config");

module.exports = {
  ...baseConfig,
  // Override with project-specific config
  displayName: "core",
  // Use the test-specific TypeScript config
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },
};
