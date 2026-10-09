"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Họ và tên người dùng là bắt buộc"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Địa chỉ email là bắt buộc"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Mật khẩu là bắt buộc"],
        minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
        select: false,
    },
    role: {
        type: String,
        enum: {
            values: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF", "VIEWER"],
            message: "Vai trò không hợp lệ trong hệ thống",
        },
        default: "WAREHOUSE_STAFF",
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
    },
    avatar: {
        type: String,
        default: "",
    },
    phone: {
        type: String,
        default: "",
    },
    department: {
        type: String,
        default: "Kho vận",
    },
}, {
    timestamps: true,
});
userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) {
        return next();
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = async function (candidate) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(candidate, this.password);
};
exports.User = (0, mongoose_1.model)("User", userSchema);
