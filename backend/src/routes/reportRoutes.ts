import { Router } from "express";
import {
    getRevenueAnalytics,
    getInventoryAnalytics,
    getAIDemandForecast,
} from "../controllers/reportController";
import { protectAdmin } from "../middleware/auth";

const router = Router();

router.get("/revenue-analytics", protectAdmin, getRevenueAnalytics);
router.get("/inventory-analytics", protectAdmin, getInventoryAnalytics);
router.get("/ai-forecast", protectAdmin, getAIDemandForecast);
router.get("/ai-forecast/:productId", protectAdmin, getAIDemandForecast);

export default router;
