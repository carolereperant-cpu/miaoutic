-- ============================================================
-- compte-sauvegarde.sql
-- Miaoutic - compte MySQL réservé aux sauvegardes (serveur)
--
-- Principe du moindre privilège : ce compte peut LIRE la base pour
-- la copier, mais ne peut rien modifier ni supprimer. Si son mot
-- de passe est volé, les données ne peuvent pas être altérées.
--
-- Avant de l'exécuter, remplacer CHANGE_ME_BACKUP_PASSWORD par un
-- mot de passe fort. Puis créer sur le serveur un fichier d'options
-- lisible par le seul propriétaire (chmod 600), par exemple
-- /home/miaoutic/.miaoutic-backup.cnf :
--
--   [client]
--   user=miaoutic_backup
--   password="le_mot_de_passe"
--
-- Les guillemets sont indispensables : sans eux, un # dans le mot
-- de passe est lu comme le début d'un commentaire.
--
-- et lancer la sauvegarde avec :
--   MYSQL_DEFAULTS_FILE=/home/miaoutic/.miaoutic-backup.cnf ./database/sauvegarde/sauvegarde.sh
-- ============================================================

DROP USER IF EXISTS 'miaoutic_backup'@'localhost';
CREATE USER 'miaoutic_backup'@'localhost' IDENTIFIED BY 'CHANGE_ME_BACKUP_PASSWORD';

-- SELECT : lire les données ; SHOW VIEW et TRIGGER : copier la
-- définition des vues et des déclencheurs ; LOCK TABLES : prévu
-- par mysqldump pour les tables qui ne sont pas en InnoDB
GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES ON miaoutic.* TO 'miaoutic_backup'@'localhost';

FLUSH PRIVILEGES;
