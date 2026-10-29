// ============================================================
// 01_fiches_animaux.js
// Miaoutic - MongoDB collection "fiches_animaux" + test data
//
// Run with mongosh:
//   mongosh "mongodb://localhost:27017/miaoutic" database/mongo/01_fiches_animaux.js
//
// Why MongoDB for these sheets?
// Health and personality details depend on the species: a dog
// has a leash behaviour, a cat may need outdoor access, a rodent
// must live in a group... A document database stores these
// varying fields without empty columns or extra tables.
// Each document is linked to MySQL through animalId
// (= animal.id_animal).
// ============================================================

// Start from a clean state (test environment only)
db.fiches_animaux.drop();

// ------------------------------------------------------------
// Collection with a JSON Schema validator: MongoDB rejects any
// document that does not respect the common structure, while
// the "details" sub-document stays free for species-specific data.
// ------------------------------------------------------------
db.createCollection('fiches_animaux', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['animalId', 'espece', 'sante', 'caractere', 'miseAJour'],
      additionalProperties: false,
      properties: {
        _id: { bsonType: 'objectId' },
        animalId: {
          bsonType: 'number',
          minimum: 1,
          description: 'id_animal of the MySQL table animal'
        },
        espece: {
          enum: ['chien', 'chat', 'lapin', 'rongeur'],
          description: 'Species, used to read the details sub-document'
        },
        sante: {
          bsonType: 'object',
          required: ['sterilise', 'identification', 'vaccins'],
          properties: {
            sterilise: { bsonType: 'bool' },
            identification: { enum: ['puce', 'tatouage', 'aucune'] },
            vaccins: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['nom', 'date'],
                properties: {
                  nom: { bsonType: 'string', maxLength: 100 },
                  date: { bsonType: 'date' }
                }
              }
            },
            traitements: { bsonType: 'array', items: { bsonType: 'string', maxLength: 200 } },
            remarques: { bsonType: 'string', maxLength: 1000 }
          }
        },
        caractere: {
          bsonType: 'object',
          required: ['traits'],
          properties: {
            traits: { bsonType: 'array', maxItems: 10, items: { bsonType: 'string', maxLength: 50 } },
            details: { bsonType: 'object', description: 'Free, species-specific fields' }
          }
        },
        miseAJour: { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});

// One sheet per animal: the unique index enforces the 1-1 link with MySQL
db.fiches_animaux.createIndex({ animalId: 1 }, { unique: true, name: 'uq_animal_id' });

// ------------------------------------------------------------
// Test data: one sheet for each of the 16 animals of 03_data.sql
// ------------------------------------------------------------
const now = new Date();

db.fiches_animaux.insertMany([
  // ---------- Dogs ----------
  {
    animalId: 1, espece: 'chien',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'CHPPiL', date: new Date('2026-06-15') }, { nom: 'Rage', date: new Date('2026-06-15') }],
      traitements: [], remarques: 'Légère arthrose, à surveiller.'
    },
    caractere: {
      traits: ['calme', 'câline', 'sociable'],
      details: { marcheEnLaisse: 'bonne', resteSeul: 'jusqu’à 4 h', ordresConnus: ['assis', 'couché', 'au pied'] }
    },
    miseAJour: now
  },
  {
    animalId: 2, espece: 'chien',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'CHPPiL', date: new Date('2026-08-05') }],
      traitements: []
    },
    caractere: {
      traits: ['sportif', 'joueur', 'intelligent'],
      details: { marcheEnLaisse: 'à travailler', resteSeul: 'moins de 2 h', ordresConnus: ['assis'], activitesConseillees: ['canicross', 'agility'] }
    },
    miseAJour: now
  },
  {
    animalId: 3, espece: 'chien',
    sante: {
      sterilise: true, identification: 'tatouage',
      vaccins: [{ nom: 'CHPPiL', date: new Date('2026-09-20') }],
      traitements: []
    },
    caractere: {
      traits: ['vif', 'craintif avec les enfants', 'fidèle'],
      details: { marcheEnLaisse: 'bonne', resteSeul: 'jusqu’à 3 h', ordresConnus: ['assis', 'pas bouger'] }
    },
    miseAJour: now
  },
  {
    animalId: 4, espece: 'chien',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'CHPPiL', date: new Date('2026-05-25') }, { nom: 'Rage', date: new Date('2026-05-25') }],
      traitements: []
    },
    caractere: {
      traits: ['affectueuse', 'obéissante', 'joueuse'],
      details: { marcheEnLaisse: 'très bonne', resteSeul: 'jusqu’à 4 h', ordresConnus: ['assis', 'couché', 'rapporte'] }
    },
    miseAJour: now
  },
  {
    animalId: 5, espece: 'chien',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'CHPPiL', date: new Date('2026-07-03') }],
      traitements: ['Complément articulaire quotidien'],
      remarques: 'Chien senior : visite vétérinaire conseillée tous les 6 mois.'
    },
    caractere: {
      traits: ['doux', 'calme', 'gourmand'],
      details: { marcheEnLaisse: 'bonne', resteSeul: 'jusqu’à 5 h', ordresConnus: ['assis'] }
    },
    miseAJour: now
  },
  {
    animalId: 6, espece: 'chien',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'CHPPiL', date: new Date('2026-03-12') }],
      traitements: []
    },
    caractere: {
      traits: ['joueur', 'curieux', 'énergique'],
      details: { marcheEnLaisse: 'à travailler', resteSeul: 'moins de 2 h', ordresConnus: ['assis', 'couché'] }
    },
    miseAJour: now
  },

  // ---------- Cats ----------
  {
    animalId: 7, espece: 'chat',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'Typhus-Coryza', date: new Date('2026-06-03') }],
      traitements: []
    },
    caractere: {
      traits: ['câline', 'ronronneuse', 'peureuse avec les chiens'],
      details: { modeDeVie: 'intérieur', propre: true, griffoirIndispensable: true }
    },
    miseAJour: now
  },
  {
    animalId: 8, espece: 'chat',
    sante: {
      sterilise: true, identification: 'tatouage',
      vaccins: [{ nom: 'Typhus-Coryza', date: new Date('2026-04-25') }, { nom: 'Leucose', date: new Date('2026-04-25') }],
      traitements: []
    },
    caractere: {
      traits: ['sage', 'discret', 'indépendant'],
      details: { modeDeVie: 'intérieur', propre: true }
    },
    miseAJour: now
  },
  {
    animalId: 9, espece: 'chat',
    sante: {
      sterilise: false, identification: 'puce',
      vaccins: [{ nom: 'Typhus-Coryza', date: new Date('2026-07-30') }],
      traitements: [],
      remarques: 'Stérilisation prévue avant l’adoption.'
    },
    caractere: {
      traits: ['joueuse', 'acrobate', 'curieuse'],
      details: { modeDeVie: 'intérieur avec balcon sécurisé', propre: true, jouetsPreferes: ['plumeau', 'balle à grelot'] }
    },
    miseAJour: now
  },
  {
    animalId: 10, espece: 'chat',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'Typhus-Coryza', date: new Date('2026-02-16') }],
      traitements: ['Brossage quotidien (poils longs)']
    },
    caractere: {
      traits: ['majestueux', 'exclusif', 'calme'],
      details: { modeDeVie: 'intérieur', propre: true, veutEtreSeulAnimal: true }
    },
    miseAJour: now
  },
  {
    animalId: 11, espece: 'chat',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'Typhus-Coryza', date: new Date('2026-01-07') }],
      traitements: []
    },
    caractere: {
      traits: ['bavard', 'attaché', 'sociable'],
      details: { modeDeVie: 'intérieur', propre: true }
    },
    miseAJour: now
  },
  {
    animalId: 12, espece: 'chat',
    sante: {
      sterilise: true, identification: 'puce',
      vaccins: [{ nom: 'Typhus-Coryza', date: new Date('2026-09-04') }],
      traitements: []
    },
    caractere: {
      traits: ['douce', 'sociable', 'adaptable'],
      details: { modeDeVie: 'intérieur ou extérieur', propre: true }
    },
    miseAJour: now
  },

  // ---------- Rabbits ----------
  {
    animalId: 13, espece: 'lapin',
    sante: {
      sterilise: true, identification: 'aucune',
      vaccins: [{ nom: 'Myxomatose-VHD', date: new Date('2026-08-22') }],
      traitements: []
    },
    caractere: {
      traits: ['tranquille', 'gourmand', 'câlin'],
      details: { vitEnLiberteDansLaMaison: true, manipulation: 'facile', alimentation: 'foin à volonté + légumes frais' }
    },
    miseAJour: now
  },
  {
    animalId: 14, espece: 'lapin',
    sante: {
      sterilise: true, identification: 'aucune',
      vaccins: [{ nom: 'Myxomatose-VHD', date: new Date('2026-09-12') }],
      traitements: []
    },
    caractere: {
      traits: ['exploratrice', 'joyeuse'],
      details: { vitEnLiberteDansLaMaison: true, manipulation: 'à apprivoiser doucement' }
    },
    miseAJour: now
  },

  // ---------- Rodents ----------
  {
    animalId: 15, espece: 'rongeur',
    sante: {
      sterilise: false, identification: 'aucune',
      vaccins: [], traitements: [],
      remarques: 'Apport de vitamine C indispensable (poivron, persil).'
    },
    caractere: {
      traits: ['gourmand', 'bavard'],
      details: { doitVivreEnGroupe: true, conseil: 'À adopter avec un congénère.' }
    },
    miseAJour: now
  },
  {
    animalId: 16, espece: 'rongeur',
    sante: {
      sterilise: false, identification: 'aucune',
      vaccins: [], traitements: []
    },
    caractere: {
      traits: ['intelligente', 'joueuse', 'sociable'],
      details: { doitVivreEnGroupe: true, toursAppris: ['venir à l’appel', 'slalom'] }
    },
    miseAJour: now
  }
]);

print('fiches_animaux: ' + db.fiches_animaux.countDocuments() + ' documents inserted');
