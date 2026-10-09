import { Schema, model, Document, Types } from "mongoose";

export interface IReturnItem {
    product: Types.ObjectId;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    reason?: string;
}

export interface IReturn extends Document {
    rmaNumber: string;
    order?: Types.ObjectId;
    orderNumber: string;
    customer?: Types.ObjectId;
    customerName: string;
    customerPhone: string;
    warehouse?: Types.ObjectId;
    warehouseName: string;
    items: IReturnItem[];
    returnReason: string;
    status: "PENDING" | "INSPECTED" | "RESTOCKED" | "REJECTED";
    refundStatus: "PENDING" | "REFUNDED" | "NO_REFUND";
    totalRefundAmount: number;
    inspectionNotes?: string;
    performedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const returnSchema = new Schema<IReturn>(
    {
        rmaNumber: {
            type: String,
            required: [true, "Mã RMA trả hàng là bắt buộc"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        order: {
            type: Schema.Types.ObjectId,
            ref: "Order",
        },
        orderNumber: {
            type: String,
            required: [true, "Mã đơn hàng gốc là bắt buộc"],
            trim: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
        },
        customerName: {
            type: String,
            required: [true, "Tên khách hàng là bắt buộc"],
            trim: true,
        },
        customerPhone: {
            type: String,
            default: "",
            trim: true,
        },
        warehouse: {
            type: Schema.Types.ObjectId,
            ref: "Warehouse",
        },
        warehouseName: {
            type: String,
            default: "Kho Tổng Hà Nội",
        },
        items: [
            {
                product: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                sku: {
                    type: String,
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                unitPrice: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                refundAmount: {
                    type: Number,
                    default: 0,
                },
                reason: {
                    type: String,
                    default: "",
                },
            },
        ],
        returnReason: {
            type: String,
            required: [true, "Lý do trả hàng là bắt buộc"],
        },
        status: {
            type: String,
            enum: ["PENDING", "INSPECTED", "RESTOCKED", "REJECTED"],
            default: "PENDING",
        },
        refundStatus: {
            type: String,
            enum: ["PENDING", "REFUNDED", "NO_REFUND"],
            default: "PENDING",
        },
        totalRefundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        inspectionNotes: {
            type: String,
            default: "",
        },
        performedBy: {
            type: String,
            default: "Nhân viên kho",
        },
    },
    {
        timestamps: true,
    },
);

export const Return = model<IReturn>("Return", returnSchema);
