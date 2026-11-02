// ============================================================
// routes/index.js
// Groups every route of the API under /api
// ============================================================

const { Router } = require('express');
const { health } = require('../controllers/healthController');
const { listRaces, listVaccins } = require('../controllers/referentielController');
const animalRoutes = require('./animalRoutes');
const especeRoutes = require('./especeRoutes');
const authRoutes = require('./authRoutes');
const profilRoutes = require('./profilRoutes');
const demandeRoutes = require('./demandeRoutes');

const router = Router();

router.get('/health', health);
router.get('/races', listRaces);
router.get('/vaccins', listVaccins);
router.use('/animaux', animalRoutes);
router.use('/especes', especeRoutes);
router.use('/auth', authRoutes);
router.use('/profil', profilRoutes);
router.use('/demandes', demandeRoutes);

module.exports = router;
