import { Router } from "express";
import {
    getUsers,
    getUserStats,
    getUserById,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserStatus,
    resetUserPassword,
    deleteUser,
} from "../controllers/userController";
import { protectAdmin, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protectAdmin);

router.get("/stats", restrictTo("ADMIN", "WAREHOUSE_MANAGER"), getUserStats);
router.get("/", restrictTo("ADMIN", "WAREHOUSE_MANAGER"), getUsers);
router.get("/:id", restrictTo("ADMIN", "WAREHOUSE_MANAGER"), getUserById);

router.post("/", restrictTo("ADMIN"), createUser);
router.put("/:id", restrictTo("ADMIN"), updateUser);
router.patch("/:id/role", restrictTo("ADMIN"), updateUserRole);
router.patch("/:id/status", restrictTo("ADMIN"), toggleUserStatus);
router.patch("/:id/reset-password", restrictTo("ADMIN"), resetUserPassword);
router.delete("/:id", restrictTo("ADMIN"), deleteUser);

export default router;
