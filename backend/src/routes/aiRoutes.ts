import { Router } from "express";
import {
    askAI,
    generateDescriptionAI,
    getWarehouseSnapshotAI,
    getReorderAdviceAI,
    getChatSessions,
    getChatSessionById,
    createChatSession,
    sendMessageToSession,
    deleteChatSession,
    renameChatSession,
} from "../controllers/aiController";
import { protectAdmin } from "../middleware/auth";
import { aiRateLimiter } from "../middleware/aiRateLimiter";

const router = Router();

router.post("/ask", protectAdmin, aiRateLimiter, askAI);
router.get("/snapshot", protectAdmin, getWarehouseSnapshotAI);
router.get("/reorder-advice", protectAdmin, getReorderAdviceAI);
router.post("/generate-description", protectAdmin, aiRateLimiter, generateDescriptionAI);

router.get("/sessions", protectAdmin, getChatSessions);
router.post("/sessions", protectAdmin, createChatSession);
router.get("/sessions/:id", protectAdmin, getChatSessionById);
router.post("/sessions/:id/messages", protectAdmin, aiRateLimiter, sendMessageToSession);
router.delete("/sessions/:id", protectAdmin, deleteChatSession);
router.patch("/sessions/:id/title", protectAdmin, renameChatSession);

export default router;
