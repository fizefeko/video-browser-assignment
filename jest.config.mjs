import nextJest from "next/jest.js";

/**
 * `next/jest` wires up the SWC transform, CSS/asset stubs and the `~/*` path
 * alias from tsconfig.json, so none of that needs configuring by hand.
 */
const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  // `next/jest` resolves the `~/*` alias through the SWC transform, which rewrites
  // import specifiers but not the string passed to `jest.mock()`. Mapping it here
  // makes the alias work in both.
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.d.ts",
    // Next.js entry points are covered by integration-level checks, not units.
    "!src/app/**/layout.tsx",
    "!src/app/**/page.tsx",
    "!src/**/test/fixtures/**",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
      functions: 80,
      branches: 75,
    },
  },
};

export default createJestConfig(config);
