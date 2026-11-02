// Fake configuration for the tests: config/env.js requires these
// variables. The tests never connect to a real database (the
// database layer is replaced by mocks), so the values do not matter.
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'miaoutic_test';
process.env.JWT_SECRET = 'test-secret-key-only-for-automated-tests-0123456789';
process.env.JWT_EXPIRES_IN = '2h';
// High limit so that the normal tests are never blocked; the
// brute force test sets its own low limit.
process.env.AUTH_RATE_LIMIT = process.env.AUTH_RATE_LIMIT || '1000';
