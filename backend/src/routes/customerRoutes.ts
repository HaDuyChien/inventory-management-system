import { Router } from "express";
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customerController";
import { protectAdmin, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protectAdmin);

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", restrictTo("ADMIN"), createCustomer);
router.put("/:id", restrictTo("ADMIN"), updateCustomer);
router.delete("/:id", restrictTo("ADMIN"), deleteCustomer);

export default router;
