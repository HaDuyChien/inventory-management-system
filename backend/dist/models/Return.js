"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Return = void 0;
const mongoose_1 = require("mongoose");
const returnSchema = new mongoose_1.Schema({
    rmaNumber: {
        type: String,
        required: [true, "Mã RMA trả hàng là bắt buộc"],
        unique: true,
        uppercase: true,
        trim: true,
    },
    order: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Order",
    },
    orderNumber: {
        type: String,
        required: [true, "Mã đơn hàng gốc là bắt buộc"],
        trim: true,
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
    },
    customerName: {
        type: String,
        required: [true, "Tên khách hàng là bắt buộc"],
        trim: true,
    },
    customerPhone: {
        type: String,
        default: "",
        trim: true,
    },
    warehouse: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Warehouse",
    },
    warehouseName: {
        type: String,
        default: "Kho Tổng Hà Nội",
    },
    items: [
        {
            product: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            sku: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            unitPrice: {
                type: Number,
                required: true,
                min: 0,
            },
            refundAmount: {
                type: Number,
                default: 0,
            },
            reason: {
                type: String,
                default: "",
            },
        },
    ],
    returnReason: {
        type: String,
        required: [true, "Lý do trả hàng là bắt buộc"],
    },
    status: {
        type: String,
        enum: ["PENDING", "INSPECTED", "RESTOCKED", "REJECTED"],
        default: "PENDING",
    },
    refundStatus: {
        type: String,
        enum: ["PENDING", "REFUNDED", "NO_REFUND"],
        default: "PENDING",
    },
    totalRefundAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    inspectionNotes: {
        type: String,
        default: "",
    },
    performedBy: {
        type: String,
        default: "Nhân viên kho",
    },
}, {
    timestamps: true,
});
exports.Return = (0, mongoose_1.model)("Return", returnSchema);
