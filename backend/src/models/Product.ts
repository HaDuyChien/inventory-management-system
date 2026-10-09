import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
    sku: string;
    name: string;
    category: Types.ObjectId;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    unit: string;
    images: string[];
    thumbnail: string;
    description?: string;
    status: "ACTIVE" | "DRAFT" | "ARCHIVED";
    barcode?: string;
    weight?: number;
}

const productSchema = new Schema<IProduct>(
    {
        sku: {
            type: String,
            required: [true, "Mã SKU là bắt buộc"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Tên sản phẩm là bắt buộc"],
            trim: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Danh mục sản phẩm là bắt buộc"],
        },
        price: {
            type: Number,
            required: [true, "Giá bán là bắt buộc"],
            min: [0, "Giá bán không được nhỏ hơn 0"],
        },
        costPrice: {
            type: Number,
            required: [true, "Giá vốn nhập kho là bắt buộc"],
            min: [0, "Giá vốn không được nhỏ hơn 0"],
            default: 0,
        },
        stock: {
            type: Number,
            required: [true, "Số lượng tồn kho là bắt buộc"],
            min: [0, "Số lượng tồn kho không được âm"],
            default: 0,
        },
        minStock: {
            type: Number,
            required: [true, "Ngưỡng tồn tối thiểu là bắt buộc"],
            min: [0, "Ngưỡng tồn không được âm"],
            default: 5,
        },
        unit: {
            type: String,
            required: [true, "Đơn vị tính là bắt buộc"],
            default: "Cái",
            trim: true,
        },
        images: {
            type: [String],
            default: [],
        },
        thumbnail: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: {
                values: ["ACTIVE", "DRAFT", "ARCHIVED"],
                message: "Trạng thái sản phẩm không hợp lệ",
            },
            default: "ACTIVE",
        },
        barcode: {
            type: String,
            default: "",
            trim: true,
        },
        weight: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

productSchema.index({ name: "text", sku: "text" });

export const Product = model<IProduct>("Product", productSchema);
