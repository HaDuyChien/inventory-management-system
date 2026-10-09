import { Schema, model, Document, Types } from "mongoose";

export interface ILocationBin {
    binCode: string;
    name?: string;
    capacity: number;
    currentOccupancy: number;
    status: "AVAILABLE" | "OCCUPIED" | "FULL" | "MAINTENANCE";
    product?: Types.ObjectId;
    productName?: string;
    sku?: string;
}

export interface ILocationRack {
    rackCode: string;
    name?: string;
    bins: ILocationBin[];
}

export interface IWarehouseZone {
    zoneName: string;
    code?: string;
    racks: ILocationRack[];
}

export interface IWarehouse extends Document {
    name: string;
    code: string;
    address: string;
    capacity: number;
    managerName: string;
    status: "ACTIVE" | "INACTIVE";
    zones: IWarehouseZone[];
}

const warehouseSchema = new Schema<IWarehouse>(
    {
        name: {
            type: String,
            required: [true, "Tên kho hàng là bắt buộc"],
            unique: true,
            trim: true,
        },
        code: {
            type: String,
            required: [true, "Mã kho là bắt buộc"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        address: {
            type: String,
            required: [true, "Địa chỉ kho hàng là bắt buộc"],
            trim: true,
        },
        capacity: {
            type: Number,
            required: [true, "Sức chứa kho là bắt buộc"],
            min: [0, "Sức chứa không được nhỏ hơn 0"],
        },
        managerName: {
            type: String,
            required: [true, "Tên người phụ trách kho là bắt buộc"],
            trim: true,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
        },
        zones: [
            {
                zoneName: { type: String, required: true },
                code: { type: String, default: "Z-01" },
                racks: [
                    {
                        rackCode: { type: String, required: true },
                        name: { type: String, default: "" },
                        bins: [
                            {
                                binCode: { type: String, required: true },
                                name: { type: String, default: "" },
                                capacity: { type: Number, default: 100 },
                                currentOccupancy: { type: Number, default: 0 },
                                status: {
                                    type: String,
                                    enum: ["AVAILABLE", "OCCUPIED", "FULL", "MAINTENANCE"],
                                    default: "AVAILABLE",
                                },
                                product: {
                                    type: Schema.Types.ObjectId,
                                    ref: "Product",
                                },
                                productName: { type: String, default: "" },
                                sku: { type: String, default: "" },
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
    },
);

export const Warehouse = model<IWarehouse>("Warehouse", warehouseSchema);
