/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript' },
        target: 'es2020',
      },
      module: { type: 'commonjs' },
      sourceMaps: true,
    }],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.[jt]s'],
};
