// ============================================================
// routes/index.js
// Groups every route of the API under /api
// ============================================================

const { Router } = require('express');
const { health } = require('../controllers/healthController');
const animalRoutes = require('./animalRoutes');
const especeRoutes = require('./especeRoutes');
const authRoutes = require('./authRoutes');

const router = Router();

router.get('/health', health);
router.use('/animaux', animalRoutes);
router.use('/especes', especeRoutes);
router.use('/auth', authRoutes);

module.exports = router;
