const express = require("express");

const {   checkDatabase  } = require("../controllers/database.controller");

const router = express.Router();

router.get("/", checkDatabase);

module.exports = router;