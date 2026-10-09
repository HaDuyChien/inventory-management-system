"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: [true, "Mã đơn hàng là bắt buộc"],
        unique: true,
        uppercase: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["PURCHASE", "SALES"],
        required: [true, "Loại đơn hàng là bắt buộc"],
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
    },
    customerName: {
        type: String,
        default: "",
    },
    customerPhone: {
        type: String,
        default: "",
    },
    customerEmail: {
        type: String,
        default: "",
    },
    shippingAddress: {
        type: String,
        default: "",
    },
    supplier: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Supplier",
    },
    supplierName: {
        type: String,
        default: "",
    },
    warehouse: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Warehouse",
    },
    warehouseName: {
        type: String,
        default: "",
    },
    items: [
        {
            product: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            sku: { type: String, required: true },
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            unitPrice: { type: Number, required: true, min: 0 },
            totalPrice: { type: Number, required: true, min: 0 },
        },
    ],
    totalAmount: {
        type: Number,
        required: [true, "Tổng giá trị đơn hàng là bắt buộc"],
        min: [0, "Tổng giá trị không được nhỏ hơn 0"],
    },
    status: {
        type: String,
        enum: ["DRAFT", "PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"],
        default: "PENDING",
    },
    paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID", "REFUNDED"],
        default: "PENDING",
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "VNPAY", "TRANSFER"],
        default: "COD",
    },
    vnpTransactionNo: {
        type: String,
        default: "",
    },
    vnpBankCode: {
        type: String,
        default: "",
    },
    vnpPayDate: {
        type: String,
        default: "",
    },
    notes: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});
exports.Order = (0, mongoose_1.model)("Order", orderSchema);
