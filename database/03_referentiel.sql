-- ============================================================
-- 03_referentiel.sql
-- Miaoutic - reference data: species, breeds and vaccines
--
-- Needed in EVERY environment (development, test and production):
-- the forms of the shelter offer these lists. Run after
-- 01_schema.sql. Explicit ids keep the foreign keys of
-- 04_jeu_essai.sql easy to read and to check.
-- ============================================================

SET NAMES utf8mb4;
USE miaoutic;

-- ------------------------------------------------------------
-- Species (4, like the 4 categories of "Trouve ton artisan")
-- ------------------------------------------------------------
INSERT INTO espece (id_espece, nom_espece) VALUES
    (1, 'Chiens'),
    (2, 'Chats'),
    (3, 'Lapins'),
    (4, 'Rongeurs');

-- ------------------------------------------------------------
-- Breeds
-- ------------------------------------------------------------
INSERT INTO race (id_race, nom_race, id_espece) VALUES
    (1,  'Croisé',            1),
    (2,  'Labrador',          1),
    (3,  'Berger australien', 1),
    (4,  'Jack Russell',      1),
    (5,  'Beagle',            1),
    (6,  'Épagneul breton',   1),
    (7,  'Européen',          2),
    (8,  'Maine Coon',        2),
    (9,  'Siamois',           2),
    (10, 'Chartreux',         2),
    (11, 'Bélier nain',       3),
    (12, 'Lapin nain',        3),
    (13, 'Cochon d''Inde',    4),
    (14, 'Rat domestique',    4);

-- ------------------------------------------------------------
-- Vaccines
-- ------------------------------------------------------------
INSERT INTO vaccin (id_vaccin, nom_vaccin) VALUES
    (1, 'CHPPiL'),
    (2, 'Rage'),
    (3, 'Typhus-Coryza'),
    (4, 'Leucose'),
    (5, 'Myxomatose-VHD');
