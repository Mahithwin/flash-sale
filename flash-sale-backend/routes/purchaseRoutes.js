const express = require("express");

const router = express.Router();

const { purchaseProduct } = require("../controllers/purchaseConttroller");

router.post("/", purchaseProduct);

module.exports = router;

