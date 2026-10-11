const express = require('express');

const router = express.Router();
const { gethealth } = require('../controllers/health.controller')


router.get('/', gethealth)

module.exports = router;