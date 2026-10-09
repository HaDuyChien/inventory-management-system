"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactionController_1 = require("../controllers/transactionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", transactionController_1.getTransactions);
router.post("/", auth_1.protectAdmin, (0, auth_1.restrictTo)("ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"), transactionController_1.createTransaction);
exports.default = router;
