import { Schema, model, Document, Types } from "mongoose";

export interface ITransaction extends Document {
    transactionCode: string;
    type: "INBOUND" | "OUTBOUND" | "TRANSFER" | "ADJUSTMENT" | "DAMAGE";
    product: Types.ObjectId;
    productName: string;
    sku: string;
    quantity: number;
    warehouse?: Types.ObjectId;
    warehouseName: string;
    beforeStock: number;
    afterStock: number;
    referenceCode?: string;
    performedBy: string;
    reason: string;
}

const transactionSchema = new Schema<ITransaction>(
    {
        transactionCode: {
            type: String,
            required: [true, "Mã giao dịch kho là bắt buộc"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["INBOUND", "OUTBOUND", "TRANSFER", "ADJUSTMENT", "DAMAGE"],
            required: [true, "Loại giao dịch là bắt buộc"],
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Sản phẩm giao dịch là bắt buộc"],
        },
        productName: {
            type: String,
            required: true,
        },
        sku: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: [true, "Số lượng giao dịch là bắt buộc"],
        },
        warehouse: {
            type: Schema.Types.ObjectId,
            ref: "Warehouse",
        },
        warehouseName: {
            type: String,
            default: "Kho Tổng Hà Nội",
        },
        beforeStock: {
            type: Number,
            required: true,
        },
        afterStock: {
            type: Number,
            required: true,
        },
        referenceCode: {
            type: String,
            default: "",
        },
        performedBy: {
            type: String,
            required: [true, "Người thực hiện là bắt buộc"],
        },
        reason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    },
);

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
