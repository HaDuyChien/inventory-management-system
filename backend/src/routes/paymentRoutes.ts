import { Router } from "express";
import {
    createVNPayPaymentUrl,
    verifyVNPayReturn,
    vnpayIPN,
} from "../controllers/paymentController";

const router = Router();

router.post("/vnpay/create-url", createVNPayPaymentUrl);
router.get("/vnpay/return", verifyVNPayReturn);
router.post("/vnpay/verify", verifyVNPayReturn);
router.get("/vnpay/ipn", vnpayIPN);

export default router;
