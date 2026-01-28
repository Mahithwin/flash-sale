const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");

router.get("/orders", admin.getOrders);

router.get("/stats", admin.getAdminStats);

module.exports = router;

