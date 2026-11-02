// ============================================================
// routes/profilRoutes.js - adopters only
// ============================================================

const { Router } = require('express');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { saveProfilRules, compatibiliteRules } = require('../middlewares/validators/profilValidators');
const { getProfil, saveProfil, listMatchs, getCompatibilite } = require('../controllers/profilController');

const router = Router();

// Every route of this file requires an adopter account
router.use(authenticate, authorize('adoptant'));

router.get('/', getProfil);
router.put('/', saveProfilRules, validate, saveProfil);
router.get('/matchs', listMatchs);
router.get('/compatibilite/:idAnimal', compatibiliteRules, validate, getCompatibilite);

module.exports = router;
