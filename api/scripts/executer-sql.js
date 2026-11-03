// ============================================================
// scripts/executer-sql.js
// Runs SQL scripts on a hosted MySQL database (Aiven...), from
// the computer of the developer, through an encrypted connection.
// Used once to create the database online (no phpMyAdmin there).
//
// Usage, in the api/ folder:
//   node scripts/executer-sql.js ../database/01_schema.sql ../database/02_users_hebergee.sql ...
//
// The connection settings are read from api/.env.admin (never
// sent to Git, see .env.admin.example):
//   ADMIN_DB_HOST, ADMIN_DB_PORT, ADMIN_DB_USER, ADMIN_DB_PASSWORD
//   DB_SSL_CA_FILE   certificate of the authority (TLS)
//   APP_DB_PASSWORD  password given to the account of the API: it
//                    replaces CHANGE_ME_STRONG_PASSWORD in the scripts,
//                    so the real password is never written in a file
//                    that could be sent to GitHub.
// ============================================================

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.admin'), quiet: true });

const PLACEHOLDER = "'CHANGE_ME_STRONG_PASSWORD'";

function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    fail('indiquez les fichiers SQL à exécuter, dans l\'ordre.');
  }

  const missing = ['ADMIN_DB_HOST', 'ADMIN_DB_USER', 'ADMIN_DB_PASSWORD', 'DB_SSL_CA_FILE']
    .filter((name) => !process.env[name]);
  if (missing.length > 0) {
    fail(`variables absentes de api/.env.admin : ${missing.join(', ')} (voir .env.admin.example)`);
  }

  // Read every file and check the password BEFORE running anything:
  // never stop half way with a database partly created
  const password = process.env.APP_DB_PASSWORD ?? '';
  const scripts = files.map((file) => {
    const sql = fs.readFileSync(file, 'utf8');
    if (sql.includes(PLACEHOLDER) && password.length < 16) {
      fail(`${file} crée le compte de l'API : mettez dans APP_DB_PASSWORD un mot de passe d'au moins 16 caractères.`);
    }
    return { file, sql };
  });

  const connection = await mysql.createConnection({
    host: process.env.ADMIN_DB_HOST,
    port: Number(process.env.ADMIN_DB_PORT) || 3306,
    user: process.env.ADMIN_DB_USER,
    password: process.env.ADMIN_DB_PASSWORD,
    // Encrypted connection, server certificate checked
    ssl: { ca: fs.readFileSync(process.env.DB_SSL_CA_FILE, 'utf8'), rejectUnauthorized: true },
    // A script contains several statements separated by ";".
    // Only allowed here, for trusted files: never in the API.
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    for (const { file, sql } of scripts) {
      // escape() adds the quotes and escapes special characters:
      // the password cannot break the SQL statement
      await connection.query(sql.replaceAll(PLACEHOLDER, connection.escape(password)));
      console.log(`OK  ${file}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => fail(error.message));
