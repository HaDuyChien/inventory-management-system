import { Request, Response, NextFunction } from "express";
import { Transaction } from "../models/Transaction";
import { Product } from "../models/Product";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getTransactions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const filter: Record<string, unknown> = {};
        if (req.query.productId) filter.product = req.query.productId;
        if (req.query.type) filter.type = req.query.type;

        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .populate("product", "name sku thumbnail price stock")
            .populate("warehouse", "name code");

        sendSuccess(res, transactions, "Lấy lịch sử giao dịch kho thành công");
    },
);

export const createTransaction = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { type, productId, quantity, warehouseName, reason, performedBy, referenceCode } =
            req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return next(new AppError("Không tìm thấy sản phẩm chỉ định", 404));
        }

        const beforeStock = product.stock;
        let afterStock = beforeStock;

        if (type === "INBOUND") {
            afterStock += Number(quantity);
        } else if (type === "OUTBOUND" || type === "DAMAGE") {
            afterStock = Math.max(0, beforeStock - Number(quantity));
        } else if (type === "ADJUSTMENT") {
            afterStock = Math.max(0, beforeStock + Number(quantity));
        }

        product.stock = afterStock;
        await product.save();

        const transactionCode = `TX-${Date.now().toString().slice(-6)}`;
        const tx = await Transaction.create({
            transactionCode,
            type,
            product: product._id,
            productName: product.name,
            sku: product.sku,
            quantity: Math.abs(Number(quantity)),
            warehouseName: warehouseName || "Kho Tổng Hà Nội",
            beforeStock,
            afterStock,
            referenceCode: referenceCode || "",
            performedBy: performedBy || "Quản trị viên",
            reason: reason || "Điều chỉnh tồn kho",
        });

        await AuditLog.create({
            user: performedBy || "Quản trị viên",
            userRole: "ADMIN",
            action: `GIAO_DỊCH_${type}`,
            resource: "Tồn kho",
            resourceId: `${product.name} [${product.sku}]`,
            previousValue: `${beforeStock} chiếc`,
            newValue: `${afterStock} chiếc, thay đổi: ${quantity}`,
        });

        sendSuccess(res, tx, "Ghi nhận giao dịch kho thành công", 201);
    },
);
