"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    transactionCode: {
        type: String,
        required: [true, "Mã giao dịch kho là bắt buộc"],
        unique: true,
        uppercase: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["INBOUND", "OUTBOUND", "TRANSFER", "ADJUSTMENT", "DAMAGE"],
        required: [true, "Loại giao dịch là bắt buộc"],
    },
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Sản phẩm giao dịch là bắt buộc"],
    },
    productName: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: [true, "Số lượng giao dịch là bắt buộc"],
    },
    warehouse: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Warehouse",
    },
    warehouseName: {
        type: String,
        default: "Kho Tổng Hà Nội",
    },
    beforeStock: {
        type: Number,
        required: true,
    },
    afterStock: {
        type: Number,
        required: true,
    },
    referenceCode: {
        type: String,
        default: "",
    },
    performedBy: {
        type: String,
        required: [true, "Người thực hiện là bắt buộc"],
    },
    reason: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});
exports.Transaction = (0, mongoose_1.model)("Transaction", transactionSchema);
