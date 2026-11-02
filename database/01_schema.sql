-- ============================================================
-- 01_schema.sql
-- Miaoutic - relational database
-- Creates the database and every table.
-- Compatible with MySQL 8 and MariaDB 10.4+ (engine shipped with XAMPP).
--
-- Naming convention (kept from the "Trouve ton artisan" project):
--   - snake_case, singular French table names
--   - primary keys named id_<table>
--   - constraints prefixed pk_ / fk_ / uq_ / ck_, indexes idx_
-- ============================================================

-- Start from a clean state (test environment only)
DROP DATABASE IF EXISTS miaoutic;

-- utf8mb4 stores every character, including accents and emojis
CREATE DATABASE miaoutic
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE miaoutic;

-- ============================================================
-- TABLE: espece
-- Animal species (Chiens, Chats, Lapins...).
-- Used for the main navigation menu.
-- ============================================================
CREATE TABLE espece (
    id_espece       INT             NOT NULL AUTO_INCREMENT,
    nom_espece      VARCHAR(50)     NOT NULL,

    CONSTRAINT pk_espece PRIMARY KEY (id_espece),
    CONSTRAINT uq_espece_nom UNIQUE (nom_espece)
) ENGINE = InnoDB;

-- ============================================================
-- TABLE: race
-- Breeds. Each breed belongs to exactly one species.
-- ============================================================
CREATE TABLE race (
    id_race         INT             NOT NULL AUTO_INCREMENT,
    nom_race        VARCHAR(100)    NOT NULL,
    id_espece       INT             NOT NULL,

    CONSTRAINT pk_race PRIMARY KEY (id_race),

    -- The same breed name cannot appear twice for one species
    CONSTRAINT uq_race_nom_espece UNIQUE (nom_race, id_espece),

    -- RESTRICT: a species that still has breeds cannot be deleted
    CONSTRAINT fk_race_espece
        FOREIGN KEY (id_espece) REFERENCES espece (id_espece)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ============================================================
-- TABLE: utilisateur
-- Accounts of adopters and shelter staff.
-- GDPR: only the data the service needs is collected
-- (no phone number, no postal address).
-- ============================================================
CREATE TABLE utilisateur (
    id_utilisateur      INT             NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255)    NOT NULL,

    -- bcrypt hash (always 60 characters). The plain password is never stored.
    mot_de_passe_hash   CHAR(60)        NOT NULL,

    prenom              VARCHAR(100)    NOT NULL,
    nom                 VARCHAR(100)    NOT NULL,

    -- Role used by the API to grant or deny access to each route
    role                ENUM('adoptant', 'refuge') NOT NULL DEFAULT 'adoptant',

    date_creation       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_utilisateur PRIMARY KEY (id_utilisateur),
    CONSTRAINT uq_utilisateur_email UNIQUE (email)
) ENGINE = InnoDB;

-- ============================================================
-- TABLE: profil_adoptant
-- Lifestyle questionnaire filled in by an adopter.
-- One profile per user (1-1 relation): the primary key is
-- also the foreign key to utilisateur.
-- These answers feed the compatibility score.
-- ============================================================
CREATE TABLE profil_adoptant (
    id_utilisateur      INT             NOT NULL,
    logement            ENUM('appartement', 'maison_sans_jardin', 'maison_avec_jardin') NOT NULL,
    a_enfants           BOOLEAN         NOT NULL,
    a_chien             BOOLEAN         NOT NULL,
    a_chat              BOOLEAN         NOT NULL,
    temps_disponible    ENUM('faible', 'moyen', 'eleve') NOT NULL,
    date_maj            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_profil_adoptant PRIMARY KEY (id_utilisateur),

    -- CASCADE: deleting an account also deletes its profile
    -- (GDPR right to erasure)
    CONSTRAINT fk_profil_adoptant_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateur (id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ============================================================
-- TABLE: animal
-- Animals of the shelter: identity, compatibility criteria
-- (used by the filters and the compatibility score) and the
-- main health information. Vaccinations are stored in their
-- own table because an animal can receive several of them.
-- ============================================================
CREATE TABLE animal (
    id_animal       INT             NOT NULL AUTO_INCREMENT,
    nom             VARCHAR(50)     NOT NULL,
    sexe            ENUM('male', 'femelle') NOT NULL,

    -- Birth date (possibly estimated) rather than an age:
    -- an age column would be wrong after a few months
    date_naissance  DATE            NOT NULL,

    taille          ENUM('petit', 'moyen', 'grand') NOT NULL,
    energie         ENUM('calme', 'modere', 'energique') NOT NULL,

    -- Compatibility criteria
    ok_enfants      BOOLEAN         NOT NULL,
    ok_chiens       BOOLEAN         NOT NULL,
    ok_chats        BOOLEAN         NOT NULL,
    besoin_jardin   BOOLEAN         NOT NULL DEFAULT FALSE,

    description     TEXT            NOT NULL,

    -- Health
    sterilise       BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Mandatory identification of dogs and cats in France
    identification  ENUM('puce', 'tatouage', 'aucune') NOT NULL DEFAULT 'aucune',
    -- Treatments, points to watch... (optional)
    remarques_sante TEXT            NULL,

    -- Optional picture (path or URL)
    photo           VARCHAR(255)    NULL,

    statut          ENUM('disponible', 'reserve', 'adopte') NOT NULL DEFAULT 'disponible',

    -- Highlighted on the home page ("Les cœurs à prendre du mois")
    coup_de_coeur   BOOLEAN         NOT NULL DEFAULT FALSE,

    date_arrivee    DATE            NOT NULL,
    id_race         INT             NOT NULL,

    CONSTRAINT pk_animal PRIMARY KEY (id_animal),

    -- An animal cannot arrive at the shelter before being born
    CONSTRAINT ck_animal_dates CHECK (date_arrivee >= date_naissance),

    CONSTRAINT fk_animal_race
        FOREIGN KEY (id_race) REFERENCES race (id_race)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- The list page always filters on the status: an index speeds it up
CREATE INDEX idx_animal_statut ON animal (statut);

-- ============================================================
-- TABLE: vaccin
-- Reference list of vaccines (CHPPiL, Rage, Typhus-Coryza...).
-- A separate table avoids typing the same vaccine name again
-- for every animal (third normal form).
-- ============================================================
CREATE TABLE vaccin (
    id_vaccin       INT             NOT NULL AUTO_INCREMENT,
    nom_vaccin      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_vaccin PRIMARY KEY (id_vaccin),
    CONSTRAINT uq_vaccin_nom UNIQUE (nom_vaccin)
) ENGINE = InnoDB;

-- ============================================================
-- TABLE: vaccination
-- Association table between animal and vaccin (many-to-many),
-- carrying the date of the injection.
-- The date belongs to the primary key so that the same vaccine
-- can be given again later (booster).
-- ============================================================
CREATE TABLE vaccination (
    id_animal         INT           NOT NULL,
    id_vaccin         INT           NOT NULL,
    date_vaccination  DATE          NOT NULL,

    CONSTRAINT pk_vaccination PRIMARY KEY (id_animal, id_vaccin, date_vaccination),

    -- CASCADE: if an animal is deleted, its vaccinations go with it
    CONSTRAINT fk_vaccination_animal
        FOREIGN KEY (id_animal) REFERENCES animal (id_animal)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- RESTRICT: a vaccine already given cannot be deleted
    CONSTRAINT fk_vaccination_vaccin
        FOREIGN KEY (id_vaccin) REFERENCES vaccin (id_vaccin)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ============================================================
-- TABLE: demande_adoption
-- Adoption requests sent by adopters.
-- ============================================================
CREATE TABLE demande_adoption (
    id_demande          INT             NOT NULL AUTO_INCREMENT,
    id_utilisateur      INT             NOT NULL,
    id_animal           INT             NOT NULL,
    message             TEXT            NOT NULL,

    -- Score (0-100) computed by the API when the request is sent.
    -- Stored so the shelter sees the score at that moment,
    -- even if the adopter edits the profile later.
    score_compatibilite TINYINT UNSIGNED NOT NULL,

    statut              ENUM('recue', 'en_etude', 'acceptee', 'refusee', 'annulee') NOT NULL DEFAULT 'recue',
    date_creation       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_maj            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Generated column: 1 while the request is active, NULL otherwise.
    -- A UNIQUE index ignores NULL values, so the index below allows
    -- many closed requests but only ONE active request per adopter
    -- and per animal. The database itself guarantees the business
    -- rule, even if two clicks arrive at the same time.
    est_active          TINYINT AS (IF(statut IN ('recue', 'en_etude'), 1, NULL)) STORED,

    CONSTRAINT pk_demande_adoption PRIMARY KEY (id_demande),
    CONSTRAINT uq_demande_active UNIQUE (id_utilisateur, id_animal, est_active),
    CONSTRAINT ck_demande_score CHECK (score_compatibilite BETWEEN 0 AND 100),

    -- CASCADE: deleting an account deletes its requests (GDPR)
    CONSTRAINT fk_demande_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateur (id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- RESTRICT: an animal with requests cannot be deleted;
    -- the shelter changes its status instead
    CONSTRAINT fk_demande_animal
        FOREIGN KEY (id_animal) REFERENCES animal (id_animal)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE = InnoDB;
