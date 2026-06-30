module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'static/**/*.js',
    '!static/**/*.min.js',
    '!static/vendor/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage/frontend',
  coverageReporters: ['text', 'cobertura', 'html']
};
