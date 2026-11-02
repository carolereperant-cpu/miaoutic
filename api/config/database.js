// ============================================================
// config/database.js
// Connection pool to the MySQL / MariaDB database.
// A pool keeps a few connections open and reuses them, instead
// of opening a new connection for every HTTP request.
// ============================================================

const mysql = require('mysql2/promise');
const { db } = require('./env');

const pool = mysql.createPool({
  ...db,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,

  // Return DATE / DATETIME columns as plain strings ('2026-06-12'):
  // no hidden time zone conversion by JavaScript Date objects.
  dateStrings: true,

  // MySQL stores BOOLEAN as TINYINT(1) and returns 0 / 1.
  // Convert these columns to real JavaScript booleans.
  typeCast(field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      const value = field.string();
      return value === null ? null : value === '1';
    }
    return next();
  },
});

module.exports = pool;
