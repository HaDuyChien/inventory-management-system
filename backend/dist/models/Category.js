"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Tên danh mục là bắt buộc"],
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: [true, "Đường dẫn định danh danh mục là bắt buộc"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
        trim: true,
    },
    image: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: {
            values: ["ACTIVE", "INACTIVE"],
            message: "Trạng thái danh mục không hợp lệ",
        },
        default: "ACTIVE",
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.Category = (0, mongoose_1.model)("Category", categorySchema);
