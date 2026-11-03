-- ============================================================
-- compte-sauvegarde.sql
-- Miaoutic - MySQL account reserved for backups (server)
--
-- Principle of least privilege: this account can READ the database
-- to copy it, but cannot change or delete anything. If its password
-- is stolen, the data cannot be altered.
--
-- Before running it, replace CHANGE_ME_BACKUP_PASSWORD with a strong
-- password. Then create on the server an option file readable by
-- its owner only (chmod 600), for example
-- /home/miaoutic/.miaoutic-backup.cnf:
--
--   [client]
--   user=miaoutic_backup
--   password="the_password"
--
-- The quotes are required: without them, a # in the password is
-- read as the start of a comment.
--
-- Then run the backup with:
--   MYSQL_DEFAULTS_FILE=/home/miaoutic/.miaoutic-backup.cnf ./database/sauvegarde/sauvegarde.sh
-- ============================================================

DROP USER IF EXISTS 'miaoutic_backup'@'localhost';
CREATE USER 'miaoutic_backup'@'localhost' IDENTIFIED BY 'CHANGE_ME_BACKUP_PASSWORD';

-- SELECT: read the data; SHOW VIEW and TRIGGER: copy the definition
-- of views and triggers; LOCK TABLES: used by mysqldump for tables
-- that are not InnoDB
GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES ON miaoutic.* TO 'miaoutic_backup'@'localhost';

FLUSH PRIVILEGES;
