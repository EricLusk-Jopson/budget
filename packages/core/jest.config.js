const baseConfig = require("@budget/jest-config");

module.exports = {
  ...baseConfig,
  displayName: "core",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
};
