module.exports = {
  projects: [
    {
      displayName: 'fabric-client',
      testMatch: ['<rootDir>/packages/fabric-client/src/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/packages/fabric-client/src/setupTests.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/packages/fabric-client/src/setupTests.ts'],
    },
    {
      displayName: 'chaos',
      testMatch: ['<rootDir>/tests/chaos/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/packages/fabric-client/src/setupTests.ts'],
    },
  ],
  collectCoverageFrom: [
    'packages/**/src/**/*.ts',
    'services/**/src/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
