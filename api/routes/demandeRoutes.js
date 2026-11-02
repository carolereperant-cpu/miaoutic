// ============================================================
// routes/demandeRoutes.js
// Adopters: create, list and cancel THEIR requests.
// Shelter: list every request and change its status.
// ============================================================

const { Router } = require('express');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const {
  createDemandeRules, cancelDemandeRules, listDemandesRules, changeStatutRules,
} = require('../middlewares/validators/demandeValidators');
const {
  createDemande, listMesDemandes, cancelDemande, listDemandes, changeStatut,
} = require('../controllers/demandeController');

const router = Router();
const adoptant = [authenticate, authorize('adoptant')];
const refuge = [authenticate, authorize('refuge')];

// Adopters
router.post('/', adoptant, createDemandeRules, validate, createDemande);
router.get('/mes-demandes', adoptant, listMesDemandes);
router.patch('/:id/annulation', adoptant, cancelDemandeRules, validate, cancelDemande);

// Shelter
router.get('/', refuge, listDemandesRules, validate, listDemandes);
router.patch('/:id/statut', refuge, changeStatutRules, validate, changeStatut);

module.exports = router;
