"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const auditLogSchema = new mongoose_1.Schema({
    user: {
        type: String,
        required: [true, "Tên người thao tác là bắt buộc"],
        trim: true,
    },
    userRole: {
        type: String,
        default: "STAFF",
    },
    action: {
        type: String,
        required: [true, "Hành động là bắt buộc"],
        trim: true,
    },
    resource: {
        type: String,
        required: [true, "Tài nguyên thao tác là bắt buộc"],
        trim: true,
    },
    resourceId: {
        type: String,
        default: "",
    },
    previousValue: {
        type: String,
        default: "",
    },
    newValue: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});
exports.AuditLog = (0, mongoose_1.model)("AuditLog", auditLogSchema);
