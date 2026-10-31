const express = require('express');

const router = express.Router();
const { gethealth, getLiveness, getReadiness } = require('../controllers/health.controller');

// Root health probe
router.get('/', gethealth);

// Dual SRE Kubernetes/Docker liveness & readiness probes
router.get('/live', getLiveness);
router.get('/ready', getReadiness);

module.exports = router;