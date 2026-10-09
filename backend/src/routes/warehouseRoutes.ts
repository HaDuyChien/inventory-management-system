import { Router } from "express";
import {
    getWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addZone,
    addRack,
    addBin,
    updateBin,
    relocateStock,
} from "../controllers/warehouseController";
import { protectAdmin, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/", getWarehouses);
router.get("/:id", getWarehouseById);

router.post("/relocate", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"), relocateStock);

router.post("/:id/zones", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), addZone);
router.post("/:id/racks", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), addRack);
router.post("/:id/bins", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), addBin);
router.put("/:id/bins", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), updateBin);

router.post("/", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), createWarehouse);
router.put("/:id", protectAdmin, restrictTo("ADMIN", "WAREHOUSE_MANAGER"), updateWarehouse);
router.delete("/:id", protectAdmin, restrictTo("ADMIN"), deleteWarehouse);

export default router;
