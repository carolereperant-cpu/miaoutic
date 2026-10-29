-- ============================================================
-- 03_data.sql
-- Miaoutic - test data set (test environment only)
--
-- Run after 01_schema.sql. Explicit ids are used so that the
-- foreign keys below are easy to read and to check.
--
-- Test accounts: every password is  Miaoutic#2026
-- (stored as bcrypt hashes, cost 12).
-- Emails use the reserved .test domain, so no real address
-- can ever receive a message from the test environment.
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
-- Users: 2 shelter staff + 4 adopters
-- Hugo has no profile yet: used to test that a profile is
-- required before sending a request.
-- ------------------------------------------------------------
INSERT INTO utilisateur (id_utilisateur, email, mot_de_passe_hash, prenom, nom, role, date_creation) VALUES
    (1, 'refuge@miaoutic.test',          '$2b$12$IeOnJMt/s9XCV9NlfIVQbeeZdtjAE/MB6gY52TfwE3kTr96nXOYcC', 'Sophie', 'Martin',  'refuge',   '2026-01-02 09:00:00'),
    (2, 'benevole@miaoutic.test',        '$2b$12$3dd7WL5wnv18KrBF4lysh.PBMlorSHUuWwuSis8qKMz1uHFF6k7x2', 'Karim',  'Benali',  'refuge',   '2026-01-15 14:30:00'),
    (3, 'lea.dubois@miaoutic.test',      '$2b$12$.Gt4OrWzDJYNVAkRpG8bZOZAqjwTOv70YFuv/5BXrO3iavn7QcbIS', 'Léa',    'Dubois',  'adoptant', '2026-09-03 18:12:00'),
    (4, 'thomas.moreau@miaoutic.test',   '$2b$12$cvIg8ARfySciJ5IelzIZvenVNWnjEG4Naq12bJXb9dOKJFezclpLO', 'Thomas', 'Moreau',  'adoptant', '2026-02-20 20:45:00'),
    (5, 'ines.garcia@miaoutic.test',     '$2b$12$Or27oo/KfRdSj5XdOBAofeIPJpvn35c30nC35odROExQiuZnvXJe6', 'Inès',   'Garcia',  'adoptant', '2026-01-08 12:05:00'),
    (6, 'hugo.lefevre@miaoutic.test',    '$2b$12$19mFvDCARQwJmBStFZO.ROXUdZh0eoWB7h6MCl5pwPUh.Svsz71me', 'Hugo',   'Lefèvre', 'adoptant', '2026-10-20 10:00:00');

-- ------------------------------------------------------------
-- Adopter profiles (lifestyle questionnaire)
-- ------------------------------------------------------------
INSERT INTO profil_adoptant (id_utilisateur, logement, a_enfants, a_chien, a_chat, temps_disponible) VALUES
    -- Léa: flat, no children, already has a cat, average free time
    (3, 'appartement',        FALSE, FALSE, TRUE,  'moyen'),
    -- Thomas: house with garden, children, already has a dog, a lot of free time
    (4, 'maison_avec_jardin', TRUE,  TRUE,  FALSE, 'eleve'),
    -- Inès: house without garden, children, no other pet, little free time
    (5, 'maison_sans_jardin', TRUE,  FALSE, FALSE, 'faible');

-- ------------------------------------------------------------
-- Animals (16, like the 17 craftsmen of "Trouve ton artisan")
-- 3 favourites for the home page, 2 reserved, 2 adopted.
-- ------------------------------------------------------------
INSERT INTO animal
    (id_animal, nom, sexe, date_naissance, taille, energie,
     ok_enfants, ok_chiens, ok_chats, besoin_jardin,
     description, photo, statut, coup_de_coeur, date_arrivee, id_race)
VALUES
    -- Dogs
    (1, 'Pépette', 'femelle', '2019-05-10', 'moyen', 'calme',
     TRUE, TRUE, TRUE, FALSE,
     'Douce et posée, Pépette adore les siestes au soleil et les balades tranquilles. Elle s''entend avec tout le monde, chats compris.',
     NULL, 'disponible', TRUE, '2026-06-12', 1),

    (2, 'Rocket', 'male', '2023-02-20', 'grand', 'energique',
     TRUE, TRUE, FALSE, TRUE,
     'Un vrai sportif ! Rocket a besoin de grandes promenades et d''un jardin pour se dépenser. Parfait pour une famille active.',
     NULL, 'disponible', FALSE, '2026-08-03', 3),

    (3, 'Biscuit', 'male', '2021-09-01', 'petit', 'modere',
     FALSE, TRUE, FALSE, FALSE,
     'Petit chien plein de caractère, Biscuit est un peu craintif avec les enfants. Il cherche un foyer calme avec des adultes.',
     NULL, 'disponible', FALSE, '2026-09-15', 4),

    (4, 'Nala', 'femelle', '2020-03-14', 'grand', 'modere',
     TRUE, TRUE, TRUE, TRUE,
     'Nala est une chienne affectueuse et obéissante, qui adore jouer à la balle avec les enfants.',
     NULL, 'reserve', FALSE, '2026-05-20', 2),

    (5, 'Oslo', 'male', '2016-11-02', 'moyen', 'calme',
     TRUE, FALSE, TRUE, FALSE,
     'Oslo est un senior au grand cœur. Il ne demande qu''un panier moelleux et beaucoup de caresses pour couler des jours heureux.',
     NULL, 'disponible', TRUE, '2026-07-01', 5),

    (6, 'Filou', 'male', '2022-06-30', 'moyen', 'energique',
     TRUE, TRUE, TRUE, TRUE,
     'Joueur et curieux, Filou a besoin d''espace et de longues balades en forêt.',
     NULL, 'adopte', FALSE, '2026-03-10', 6),

    -- Cats
    (7, 'Biscotte', 'femelle', '2023-03-01', 'petit', 'calme',
     TRUE, FALSE, TRUE, FALSE,
     'Biscotte est une petite câline qui ronronne dès qu''on la prend dans les bras. Elle a peur des chiens.',
     NULL, 'disponible', TRUE, '2026-06-01', 7),

    (8, 'Moustache', 'male', '2018-08-08', 'moyen', 'calme',
     TRUE, TRUE, TRUE, FALSE,
     'Moustache est un chat sage et discret, idéal pour un premier chat en appartement.',
     NULL, 'disponible', FALSE, '2026-04-22', 10),

    (9, 'Gribouille', 'femelle', '2025-04-15', 'petit', 'energique',
     TRUE, FALSE, TRUE, FALSE,
     'Une boule d''énergie ! Gribouille grimpe partout et adore jouer avec les plumeaux.',
     NULL, 'disponible', FALSE, '2026-07-28', 7),

    (10, 'Pacha', 'male', '2020-01-25', 'grand', 'calme',
     FALSE, FALSE, FALSE, FALSE,
     'Pacha porte bien son nom : il aime être le seul roi de la maison, sans enfants ni autres animaux.',
     NULL, 'disponible', FALSE, '2026-02-14', 8),

    (11, 'Saphir', 'male', '2022-10-10', 'petit', 'modere',
     TRUE, TRUE, TRUE, FALSE,
     'Saphir est bavard et très attaché à ses humains. Il suit tout le monde de pièce en pièce.',
     NULL, 'adopte', FALSE, '2026-01-05', 9),

    (12, 'Plume', 'femelle', '2024-12-01', 'petit', 'modere',
     TRUE, TRUE, TRUE, FALSE,
     'Plume est une jeune chatte douce et sociable, qui s''adapte à tous les foyers.',
     NULL, 'reserve', FALSE, '2026-09-02', 7),

    -- Rabbits
    (13, 'Caramel', 'male', '2024-02-02', 'petit', 'calme',
     TRUE, FALSE, TRUE, FALSE,
     'Caramel est un lapin tranquille qui adore les carottes et les câlins sur le canapé.',
     NULL, 'disponible', FALSE, '2026-08-20', 11),

    (14, 'Noisette', 'femelle', '2023-07-07', 'petit', 'modere',
     TRUE, FALSE, TRUE, FALSE,
     'Noisette aime explorer la maison et faire des bonds de joie.',
     NULL, 'disponible', FALSE, '2026-09-10', 12),

    -- Rodents
    (15, 'Pistache', 'male', '2025-06-01', 'petit', 'modere',
     TRUE, FALSE, FALSE, FALSE,
     'Pistache est un cochon d''Inde gourmand qui couine de joie à l''heure du repas.',
     NULL, 'disponible', FALSE, '2026-10-01', 13),

    (16, 'Mimosa', 'femelle', '2025-08-15', 'petit', 'energique',
     TRUE, FALSE, FALSE, FALSE,
     'Mimosa est une ratte très intelligente et joueuse, qui apprend vite des petits tours.',
     NULL, 'disponible', FALSE, '2026-10-10', 14);

-- ------------------------------------------------------------
-- Adoption requests
-- Scores computed with the rules described in
-- docs/conception/score-compatibilite.md
-- ------------------------------------------------------------
INSERT INTO demande_adoption
    (id_demande, id_utilisateur, id_animal, message, score_compatibilite, statut, date_creation)
VALUES
    (1, 3, 7,  'Biscotte s''entendrait à merveille avec ma chatte Mina !',            100, 'recue',    '2026-10-21 19:30:00'),
    (2, 3, 1,  'Je cherche une compagne calme pour mes balades du week-end.',         100, 'en_etude', '2026-10-12 08:15:00'),
    (3, 3, 10, 'Pacha a l''air magnifique.',                                           30, 'annulee',  '2026-09-05 21:00:00'),
    (4, 4, 2,  'Notre jardin est grand et nos enfants adorent courir.',              100, 'recue',    '2026-10-25 17:40:00'),
    (5, 4, 6,  'Filou serait le compagnon idéal de notre chien Max.',                100, 'acceptee', '2026-03-18 11:00:00'),
    (6, 4, 7,  'Mes enfants ont eu un coup de cœur pour Biscotte.',                   30, 'refusee',  '2026-06-10 16:20:00'),
    (7, 5, 11, 'Saphir nous a fait craquer lors de notre visite au refuge.',          85, 'acceptee', '2026-01-20 10:30:00'),
    (8, 5, 12, 'Nous aimerions offrir un foyer à Plume.',                             85, 'en_etude', '2026-10-05 14:00:00'),
    (9, 5, 2,  'Rocket a l''air adorable avec les enfants.',                          50, 'recue',    '2026-10-27 09:45:00');
