"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = exports.getAuditLogs = void 0;
const AuditLog_1 = require("../models/AuditLog");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
exports.getAuditLogs = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const logs = await AuditLog_1.AuditLog.find().sort({ createdAt: -1 }).limit(100);
    (0, response_1.sendSuccess)(res, logs, "Lấy lịch sử nhật ký hệ thống thành công");
});
exports.createAuditLog = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const log = await AuditLog_1.AuditLog.create(req.body);
    (0, response_1.sendSuccess)(res, log, "Ghi nhật ký hệ thống thành công", 201);
});
