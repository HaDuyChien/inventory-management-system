import { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getAuditLogs = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
        sendSuccess(res, logs, "Lấy lịch sử nhật ký hệ thống thành công");
    },
);

export const createAuditLog = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const log = await AuditLog.create(req.body);
        sendSuccess(res, log, "Ghi nhật ký hệ thống thành công", 201);
    },
);
