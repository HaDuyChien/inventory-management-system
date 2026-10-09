"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Warehouse = void 0;
const mongoose_1 = require("mongoose");
const warehouseSchema = new mongoose_1.Schema({
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
                                type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
exports.Warehouse = (0, mongoose_1.model)("Warehouse", warehouseSchema);
