"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRateLimiter = void 0;
const response_1 = require("../utils/response");
const requestRecords = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 15;
const aiRateLimiter = (req, res, next) => {
    const identifier = req.user?._id?.toString() || req.ip || "unknown";
    const now = Date.now();
    const record = requestRecords.get(identifier);
    if (!record || now > record.resetTime) {
        requestRecords.set(identifier, {
            count: 1,
            resetTime: now + WINDOW_MS,
        });
        return next();
    }
    if (record.count >= MAX_REQUESTS) {
        const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
        (0, response_1.sendError)(res, `Bạn đã gửi quá nhiều yêu cầu AI. Vui lòng chờ ${remainingSeconds} giây trước khi thử lại.`, 429);
        return;
    }
    record.count += 1;
    return next();
};
exports.aiRateLimiter = aiRateLimiter;
