import { Schema, model, Document } from "mongoose";

export interface IAuditLog extends Document {
    user: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    previousValue?: string;
    newValue?: string;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
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
    },
    {
        timestamps: true,
    },
);

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
