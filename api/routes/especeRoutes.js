// ============================================================
// routes/especeRoutes.js
// ============================================================

const { Router } = require('express');
const { listEspeces } = require('../controllers/especeController');

const router = Router();

router.get('/', listEspeces);

module.exports = router;
