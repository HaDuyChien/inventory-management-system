import { Router } from "express";
import {
    getReturns,
    getReturnById,
    createReturn,
    updateReturnStatus,
    deleteReturn,
} from "../controllers/returnController";
import { protectAdmin, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protectAdmin);

router.get("/", getReturns);
router.get("/:id", getReturnById);
router.post(
    "/",
    restrictTo("ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"),
    createReturn,
);
router.put(
    "/:id/status",
    restrictTo("ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"),
    updateReturnStatus,
);
router.delete("/:id", restrictTo("ADMIN"), deleteReturn);

export default router;
