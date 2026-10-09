import { Router } from "express";
import {
    loginAdmin,
    registerAdmin,
    getMeAdmin,
    loginCustomer,
    registerCustomer,
    getMeCustomer,
    updateProfile,
    uploadAvatar,
} from "../controllers/authController";
import { protectAdmin, protectCustomer, restrictTo } from "../middleware/auth";
import { uploadSingleImage } from "../middleware/upload";

const router = Router();

router.post("/admin/login", loginAdmin);
router.post("/admin/register", protectAdmin, restrictTo("ADMIN"), registerAdmin);
router.get("/admin/me", protectAdmin, getMeAdmin);
router.put("/admin/profile", protectAdmin, updateProfile);
router.put("/profile", protectAdmin, updateProfile);
router.post("/admin/avatar", protectAdmin, uploadSingleImage, uploadAvatar);

router.post("/customer/login", loginCustomer);
router.post("/customer/register", registerCustomer);
router.get("/customer/me", protectCustomer, getMeCustomer);

export default router;
