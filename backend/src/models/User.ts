import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: "ADMIN" | "WAREHOUSE_MANAGER" | "WAREHOUSE_STAFF" | "VIEWER";
    status: "ACTIVE" | "INACTIVE";
    avatar?: string;
    phone?: string;
    department?: string;
    comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
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
    },
    {
        timestamps: true,
    },
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);
