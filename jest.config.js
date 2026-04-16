/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          // Jest needs CommonJS output; override the Next.js ESM settings
          module: "CommonJS",
          moduleResolution: "node",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          // Keep strict mode and other compiler options from root tsconfig
          strict: true,
          skipLibCheck: true,
          resolveJsonModule: true,
          target: "ES2017",
        },
      },
    ],
  },
  // Load .env before any test module runs
  globalSetup: "<rootDir>/tests/globalSetup.js",
  testTimeout: 30000,
  // Run tests serially — these are integration tests against a real DB
  maxWorkers: 1,
};
