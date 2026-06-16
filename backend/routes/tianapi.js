const express = require("express");
const router = express.Router();
const { getTianApiData, getCategories } = require("../controllers/tianapiController");

// GET /api/tianapi/categories - list supported categories
router.get("/categories", getCategories);

// GET /api/tianapi/:category - fetch data from TianAPI
router.get("/:category", getTianApiData);

module.exports = router;
