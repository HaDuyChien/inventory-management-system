import { Router } from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
} from "../controllers/productController";
import { protectAdmin, restrictTo } from "../middleware/auth";
import { uploadSingleImage } from "../middleware/upload";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post(
    "/upload-image",
    protectAdmin,
    restrictTo("ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"),
    uploadSingleImage,
    uploadProductImage,
);

router.post(
    "/",
    protectAdmin,
    restrictTo("ADMIN", "WAREHOUSE_MANAGER"),
    uploadSingleImage,
    createProduct,
);

router.put(
    "/:id",
    protectAdmin,
    restrictTo("ADMIN", "WAREHOUSE_MANAGER"),
    uploadSingleImage,
    updateProduct,
);

router.delete(
    "/:id",
    protectAdmin,
    restrictTo("ADMIN"),
    deleteProduct,
);

export default router;
