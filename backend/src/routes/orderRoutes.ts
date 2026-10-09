import { Router } from "express";
import {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
} from "../controllers/orderController";
import { protectAdmin, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/", getOrders);
router.get("/:id", getOrderById);

router.post("/", createOrder);
router.put("/:id", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"), updateOrderStatus);
router.put("/:id/cancel", cancelOrder);
router.delete("/:id", protectAdmin, restrictTo("ADMIN"), deleteOrder);

export default router;
