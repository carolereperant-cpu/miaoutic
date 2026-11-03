// Unit tests of config/env.js: encrypted connection to the database
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/** Loads config/env.js again with the given extra variables */
function loadEnv(extra) {
  const saved = { ...process.env };
  Object.assign(process.env, extra);
  try {
    let config;
    jest.isolateModules(() => {
      config = require('../../config/env');
    });
    return config;
  } finally {
    process.env = saved;
  }
}

describe('config/env.js - database TLS', () => {
  test('no certificate (XAMPP): no encryption options', () => {
    expect(loadEnv({ DB_SSL_CA_FILE: '' }).db.ssl).toBeUndefined();
  });

  test('with a certificate: encrypted connection and server checked', () => {
    const file = path.join(os.tmpdir(), `ca-${process.pid}.pem`);
    fs.writeFileSync(file, '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----\n');
    try {
      const { ssl } = loadEnv({ DB_SSL_CA_FILE: file }).db;
      expect(ssl.ca).toContain('BEGIN CERTIFICATE');
      // SECURITY: never accept a server whose certificate is not signed by this authority
      expect(ssl.rejectUnauthorized).toBe(true);
    } finally {
      fs.unlinkSync(file);
    }
  });

  test('missing certificate file: clear error at startup', () => {
    expect(() => loadEnv({ DB_SSL_CA_FILE: '/nowhere/ca.pem' }))
      .toThrow('DB_SSL_CA_FILE: cannot read the certificate /nowhere/ca.pem (ENOENT)');
  });
});
