import { Router } from "express";
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController";
import { protectAdmin, restrictTo } from "../middleware/auth";
import { uploadSingleImage } from "../middleware/upload";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.post(
    "/",
    protectAdmin,
    restrictTo("ADMIN", "WAREHOUSE_MANAGER"),
    uploadSingleImage,
    createCategory,
);

router.put(
    "/:id",
    protectAdmin,
    restrictTo("ADMIN", "WAREHOUSE_MANAGER"),
    uploadSingleImage,
    updateCategory,
);

router.delete(
    "/:id",
    protectAdmin,
    restrictTo("ADMIN"),
    deleteCategory,
);

export default router;
