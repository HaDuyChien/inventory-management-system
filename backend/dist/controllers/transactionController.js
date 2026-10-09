"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = exports.getTransactions = void 0;
const Transaction_1 = require("../models/Transaction");
const Product_1 = require("../models/Product");
const AuditLog_1 = require("../models/AuditLog");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
exports.getTransactions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filter = {};
    if (req.query.productId)
        filter.product = req.query.productId;
    if (req.query.type)
        filter.type = req.query.type;
    const transactions = await Transaction_1.Transaction.find(filter)
        .sort({ createdAt: -1 })
        .populate("product", "name sku thumbnail price stock")
        .populate("warehouse", "name code");
    (0, response_1.sendSuccess)(res, transactions, "Lấy lịch sử giao dịch kho thành công");
});
exports.createTransaction = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { type, productId, quantity, warehouseName, reason, performedBy, referenceCode } = req.body;
    const product = await Product_1.Product.findById(productId);
    if (!product) {
        return next(new AppError_1.AppError("Không tìm thấy sản phẩm chỉ định", 404));
    }
    const beforeStock = product.stock;
    let afterStock = beforeStock;
    if (type === "INBOUND") {
        afterStock += Number(quantity);
    }
    else if (type === "OUTBOUND" || type === "DAMAGE") {
        afterStock = Math.max(0, beforeStock - Number(quantity));
    }
    else if (type === "ADJUSTMENT") {
        afterStock = Math.max(0, beforeStock + Number(quantity));
    }
    product.stock = afterStock;
    await product.save();
    const transactionCode = `TX-${Date.now().toString().slice(-6)}`;
    const tx = await Transaction_1.Transaction.create({
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
    await AuditLog_1.AuditLog.create({
        user: performedBy || "Quản trị viên",
        userRole: "ADMIN",
        action: `GIAO_DỊCH_${type}`,
        resource: "Tồn kho",
        resourceId: `${product.name} [${product.sku}]`,
        previousValue: `${beforeStock} chiếc`,
        newValue: `${afterStock} chiếc, thay đổi: ${quantity}`,
    });
    (0, response_1.sendSuccess)(res, tx, "Ghi nhận giao dịch kho thành công", 201);
});
