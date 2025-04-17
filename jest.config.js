module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  // # of tests to run in parallel
  maxWorkers: 5,
  // Cache test results
  cache: true,
  // Show test coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  // Exclude generated files from coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/generated/'
  ],
}; 