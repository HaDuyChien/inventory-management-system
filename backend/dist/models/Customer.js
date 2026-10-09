"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const customerSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Tên khách hàng là bắt buộc"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email khách hàng là bắt buộc"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Số điện thoại khách hàng là bắt buộc"],
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Mật khẩu là bắt buộc"],
        minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
        select: false,
    },
    address: {
        type: String,
        default: "",
        trim: true,
    },
    segment: {
        type: String,
        enum: ["VIP", "LOYAL", "NEW"],
        default: "NEW",
    },
    totalOrders: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "BLOCKED"],
        default: "ACTIVE",
    },
}, {
    timestamps: true,
});
customerSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) {
        return next();
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
customerSchema.methods.comparePassword = async function (candidate) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(candidate, this.password);
};
exports.Customer = (0, mongoose_1.model)("Customer", customerSchema);
