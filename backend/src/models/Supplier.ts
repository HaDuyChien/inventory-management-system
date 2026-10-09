import { Schema, model, Document } from "mongoose";

export interface ISupplier extends Document {
    name: string;
    code: string;
    contactPerson?: string;
    email: string;
    phone: string;
    address: string;
    taxId?: string;
    category: string;
    leadTimeDays: number;
    rating: number;
    status: "ACTIVE" | "INACTIVE";
}

const supplierSchema = new Schema<ISupplier>(
    {
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
    },
    {
        timestamps: true,
    },
);

export const Supplier = model<ISupplier>("Supplier", supplierSchema);
