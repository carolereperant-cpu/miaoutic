// Fake configuration for the tests: config/env.js requires these
// variables. The tests never connect to a real database (the
// database layer is replaced by mocks), so the values do not matter.
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'miaoutic_test';
