import { Schema, model, Document, Types } from "mongoose";

export interface IOrderItem {
    product: Types.ObjectId;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface IOrder extends Document {
    orderNumber: string;
    type: "PURCHASE" | "SALES";
    customer?: Types.ObjectId;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    shippingAddress?: string;
    supplier?: Types.ObjectId;
    supplierName?: string;
    warehouse?: Types.ObjectId;
    warehouseName?: string;
    items: IOrderItem[];
    totalAmount: number;
    status: "DRAFT" | "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
    paymentStatus: "PENDING" | "PAID" | "REFUNDED";
    paymentMethod?: "COD" | "VNPAY" | "TRANSFER";
    vnpTransactionNo?: string;
    vnpBankCode?: string;
    vnpPayDate?: string;
    notes?: string;
}

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: {
            type: String,
            required: [true, "Mã đơn hàng là bắt buộc"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["PURCHASE", "SALES"],
            required: [true, "Loại đơn hàng là bắt buộc"],
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
        },
        customerName: {
            type: String,
            default: "",
        },
        customerPhone: {
            type: String,
            default: "",
        },
        customerEmail: {
            type: String,
            default: "",
        },
        shippingAddress: {
            type: String,
            default: "",
        },
        supplier: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
        },
        supplierName: {
            type: String,
            default: "",
        },
        warehouse: {
            type: Schema.Types.ObjectId,
            ref: "Warehouse",
        },
        warehouseName: {
            type: String,
            default: "",
        },
        items: [
            {
                product: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                sku: { type: String, required: true },
                name: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                unitPrice: { type: Number, required: true, min: 0 },
                totalPrice: { type: Number, required: true, min: 0 },
            },
        ],
        totalAmount: {
            type: Number,
            required: [true, "Tổng giá trị đơn hàng là bắt buộc"],
            min: [0, "Tổng giá trị không được nhỏ hơn 0"],
        },
        status: {
            type: String,
            enum: ["DRAFT", "PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "REFUNDED"],
            default: "PENDING",
        },
        paymentMethod: {
            type: String,
            enum: ["COD", "VNPAY", "TRANSFER"],
            default: "COD",
        },
        vnpTransactionNo: {
            type: String,
            default: "",
        },
        vnpBankCode: {
            type: String,
            default: "",
        },
        vnpPayDate: {
            type: String,
            default: "",
        },
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    },
);

export const Order = model<IOrder>("Order", orderSchema);
