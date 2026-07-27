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
