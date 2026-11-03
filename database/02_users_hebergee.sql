-- ============================================================
-- 02_users_hebergee.sql
-- Miaoutic - account used by the API, for a HOSTED database
-- (Aiven...). Replaces 02_users.sql in that case only.
--
-- Differences with 02_users.sql:
--   - host '%': the API runs on another server (Render), whose
--     address is not fixed, instead of 'localhost';
--   - REQUIRE SSL: the account can only connect through an
--     encrypted connection (the password and the data never travel
--     in clear text on the Internet).
-- Same rights: read and write data only, no change of structure.
--
-- Run with scripts/executer-sql.js, which replaces the password
-- below with the value of APP_DB_PASSWORD (never written here).
-- ============================================================

DROP USER IF EXISTS 'miaoutic_app'@'%';
CREATE USER 'miaoutic_app'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD' REQUIRE SSL;
GRANT SELECT, INSERT, UPDATE, DELETE ON miaoutic.* TO 'miaoutic_app'@'%';
