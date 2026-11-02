// ============================================================
// utils/transaction.js
// Runs several SQL queries as ONE transaction: either all of them
// are saved (COMMIT), or none of them (ROLLBACK) if anything fails.
//
// Example: accepting an adoption changes the request, the animal
// and the other requests. The database must never stay in a
// half-done state (animal adopted but request still pending...).
// ============================================================

const pool = require('../config/database');

/**
 * @template T
 * @param {(connection: object) => Promise<T>} work
 *   function that runs its queries with the given connection
 * @returns {Promise<T>} what "work" returns
 */
async function withTransaction(work) {
  // All the queries of a transaction must use the same connection
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback(); // cancel everything done since beginTransaction
    throw error;
  } finally {
    connection.release(); // give the connection back to the pool
  }
}

module.exports = { withTransaction };
