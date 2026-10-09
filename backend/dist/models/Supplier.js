"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supplier = void 0;
const mongoose_1 = require("mongoose");
const supplierSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Tên nhà cung cấp là bắt buộc"],
        unique: true,
        trim: true,
    },
    code: {
        type: String,
        required: [true, "Mã nhà cung cấp là bắt buộc"],
        unique: true,
        uppercase: true,
        trim: true,
    },
    contactPerson: {
        type: String,
        default: "Đại diện kinh doanh",
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email liên hệ là bắt buộc"],
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Số điện thoại là bắt buộc"],
        trim: true,
    },
    address: {
        type: String,
        required: [true, "Địa chỉ nhà cung cấp là bắt buộc"],
        trim: true,
    },
    taxId: {
        type: String,
        default: "",
        trim: true,
    },
    category: {
        type: String,
        default: "Điện tử",
    },
    leadTimeDays: {
        type: Number,
        default: 7,
        min: 1,
    },
    rating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
    },
}, {
    timestamps: true,
});
exports.Supplier = (0, mongoose_1.model)("Supplier", supplierSchema);
