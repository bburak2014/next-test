// jest.config.js
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/features/(.*)$": "<rootDir>/features/$1",
    "^@/utils/(.*)$": "<rootDir>/utils/$1",

    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  testMatch: [
    "<rootDir>/**/*.test.{js,jsx,ts,tsx}",
    "<rootDir>/**/*.spec.{js,jsx,ts,tsx}",
  ],

  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/jest.config.js",
    "!**/jest.setup.js",
  ],

  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
};

export default createJestConfig(config);
