-- ============================================================
-- 02_users.sql
-- Miaoutic - database account used by the API
--
-- Principle of least privilege: the API can read and write
-- rows, but it cannot create, alter or drop tables, nor
-- manage other accounts. If the API were compromised, the
-- attacker could not destroy the structure of the database.
--
-- Replace CHANGE_ME_STRONG_PASSWORD locally before running
-- this script. The real password is never committed: it only
-- lives in the API .env file, which is ignored by Git.
-- ============================================================

-- The account is created for 'localhost' and '127.0.0.1':
-- depending on the server settings, a local connection is
-- identified by one name or the other (XAMPP development).
-- In production, replace these hosts with the address of the
-- API server.
DROP USER IF EXISTS 'miaoutic_app'@'localhost';
DROP USER IF EXISTS 'miaoutic_app'@'127.0.0.1';

CREATE USER 'miaoutic_app'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
CREATE USER 'miaoutic_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE ON miaoutic.* TO 'miaoutic_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON miaoutic.* TO 'miaoutic_app'@'127.0.0.1';

FLUSH PRIVILEGES;
