import { Router } from "express";
import { getAuditLogs, createAuditLog } from "../controllers/auditLogController";
import { protectAdmin } from "../middleware/auth";

const router = Router();

router.get("/", protectAdmin, getAuditLogs);
router.post("/", protectAdmin, createAuditLog);

export default router;
