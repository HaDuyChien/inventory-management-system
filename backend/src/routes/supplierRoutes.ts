import { Router } from "express";
import {
    getSuppliers,
    getSupplierStats,
    getSupplierById,
    getSupplierOrders,
    paySupplierOrder,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} from "../controllers/supplierController";
import { protectAdmin, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/stats", getSupplierStats);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.get("/:id/orders", getSupplierOrders);

router.post("/:id/pay-order/:orderId", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), paySupplierOrder);
router.post("/", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), createSupplier);
router.put("/:id", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), updateSupplier);
router.delete("/:id", protectAdmin, restrictTo("ADMIN"), deleteSupplier);

export default router;
