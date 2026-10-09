import { Router } from "express";
import { getTransactions, createTransaction } from "../controllers/transactionController";
import { protectAdmin, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/", getTransactions);
router.post(
    "/",
    protectAdmin,
    restrictTo("ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"),
    createTransaction,
);

export default router;
