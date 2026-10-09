import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface ICustomer extends Document {
    name: string;
    email: string;
    phone: string;
    password?: string;
    address?: string;
    segment: "VIP" | "LOYAL" | "NEW";
    totalOrders: number;
    totalSpent: number;
    status: "ACTIVE" | "BLOCKED";
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}

const customerSchema = new Schema<ICustomer>(
    {
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
    },
    {
        timestamps: true,
    },
);

customerSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

customerSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
};

export const Customer = model<ICustomer>("Customer", customerSchema);
