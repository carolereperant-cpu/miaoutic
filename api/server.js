// ============================================================
// server.js
// Entry point: checks the database connection, then starts
// the HTTP server.  Run with: npm run dev
// ============================================================

const app = require('./app');
const pool = require('./config/database');
const { port } = require('./config/env');

async function start() {
  // Check the database before accepting requests: if XAMPP is not
  // started, we get a clear message instead of errors later on.
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Connexion à la base de données impossible :', error.message);
    console.error('Vérifiez que MySQL est démarré dans XAMPP et le contenu du fichier .env.');
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API Miaoutic démarrée : http://localhost:${port}/api`);
  });
}

start();
