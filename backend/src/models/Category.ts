import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    status: "ACTIVE" | "INACTIVE";
    productCount?: number;
}

const categorySchema = new Schema<ICategory>(
    {
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
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

export const Category = model<ICategory>("Category", categorySchema);
