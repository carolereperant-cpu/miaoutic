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

DROP USER IF EXISTS 'miaoutic_app'@'%';

-- '%' accepts connections from any host, which is needed when
-- MySQL runs in a Docker container during development.
-- In production, replace '%' with the address of the API server.
CREATE USER 'miaoutic_app'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE ON miaoutic.* TO 'miaoutic_app'@'%';

FLUSH PRIVILEGES;
