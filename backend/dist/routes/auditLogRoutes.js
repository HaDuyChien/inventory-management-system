"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditLogController_1 = require("../controllers/auditLogController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.protectAdmin, auditLogController_1.getAuditLogs);
router.post("/", auth_1.protectAdmin, auditLogController_1.createAuditLog);
exports.default = router;
