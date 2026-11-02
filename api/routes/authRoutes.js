// ============================================================
// routes/authRoutes.js
// ============================================================

const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { authRateLimit } = require('../config/env');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { registerRules, loginRules } = require('../middlewares/validators/authValidators');
const { register, login, me } = require('../controllers/authController');

const router = Router();

// ------------------------------------------------------------
// SECURITY - Brute force protection: after 10 failed attempts
// (wrong password, invalid form...) in 15 minutes, the IP address
// is blocked until the end of the period. Successful requests
// are not counted. Sign-up and login have separate counters:
// mistakes in the sign-up form do not block the login.
// ------------------------------------------------------------
function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authRateLimit,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  });
}

router.post('/inscription', createAuthLimiter(), registerRules, validate, register);
router.post('/connexion', createAuthLimiter(), loginRules, validate, login);
router.get('/moi', authenticate, me);

module.exports = router;
