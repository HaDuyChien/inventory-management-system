import { Request, Response, NextFunction } from "express";
import { Warehouse } from "../models/Warehouse";
import { Product } from "../models/Product";
import { Transaction } from "../models/Transaction";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getWarehouses = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
        const warehouses = await Warehouse.find().sort({ createdAt: -1 });

        const enriched = warehouses.map((wh) => {
            let totalBins = 0;
            let totalOccupancy = 0;

            (wh.zones || []).forEach((z) => {
                (z.racks || []).forEach((r) => {
                    (r.bins || []).forEach((b) => {
                        totalBins += 1;
                        totalOccupancy += b.currentOccupancy || 0;
                    });
                });
            });

            return {
                ...wh.toObject(),
                totalBins,
                currentOccupancy: totalOccupancy,
                occupancyRate: wh.capacity > 0 ? Math.round((totalOccupancy / wh.capacity) * 100) : 0,
            };
        });

        sendSuccess(res, enriched, "Lấy danh sách kho hàng thành công");
    },
);

export const getWarehouseById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return next(new AppError("Không tìm thấy kho hàng yêu cầu", 404));
        }

        let totalBins = 0;
        let totalOccupancy = 0;

        (warehouse.zones || []).forEach((z) => {
            (z.racks || []).forEach((r) => {
                (r.bins || []).forEach((b) => {
                    totalBins += 1;
                    totalOccupancy += b.currentOccupancy || 0;
                });
            });
        });

        const result = {
            ...warehouse.toObject(),
            totalBins,
            currentOccupancy: totalOccupancy,
            occupancyRate:
                warehouse.capacity > 0 ? Math.round((totalOccupancy / warehouse.capacity) * 100) : 0,
        };

        sendSuccess(res, result, "Lấy thông tin chi tiết kho hàng thành công");
    },
);

export const createWarehouse = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const existing = await Warehouse.findOne({
            $or: [{ name: req.body.name }, { code: req.body.code?.toUpperCase() }],
        });
        if (existing) {
            return next(new AppError("Tên kho hoặc mã kho đã tồn tại trong hệ thống", 400));
        }

        const warehouse = await Warehouse.create({
            ...req.body,
            code: req.body.code?.toUpperCase(),
        });
        sendSuccess(res, warehouse, "Tạo mới kho hàng thành công", 201);
    },
);

export const updateWarehouse = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!warehouse) {
            return next(new AppError("Không tìm thấy kho hàng để cập nhật", 404));
        }
        sendSuccess(res, warehouse, "Cập nhật thông tin kho hàng thành công");
    },
);

export const deleteWarehouse = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
        if (!warehouse) {
            return next(new AppError("Không tìm thấy kho hàng để xóa", 404));
        }
        sendSuccess(res, null, "Xóa kho hàng thành công");
    },
);

export const addZone = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { zoneName, code } = req.body;
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return next(new AppError("Không tìm thấy kho hàng", 404));
        }

        warehouse.zones.push({
            zoneName,
            code: code || `Z-0${warehouse.zones.length + 1}`,
            racks: [],
        });

        await warehouse.save();
        sendSuccess(res, warehouse, "Thêm phân khu mới thành công");
    },
);

export const addRack = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { zoneIndex, zoneCode, rackCode, name } = req.body;
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return next(new AppError("Không tìm thấy kho hàng", 404));
        }

        const zone =
            zoneCode !== undefined
                ? warehouse.zones.find((z) => z.code === zoneCode || z.zoneName === zoneCode)
                : warehouse.zones[Number(zoneIndex)];

        if (!zone) {
            return next(new AppError("Không tìm thấy phân khu chỉ định", 404));
        }

        zone.racks.push({
            rackCode: rackCode || `R-0${zone.racks.length + 1}`,
            name: name || `Kệ ${rackCode || `R-0${zone.racks.length + 1}`}`,
            bins: [],
        });

        await warehouse.save();
        sendSuccess(res, warehouse, "Thêm dãy kệ thành công");
    },
);

export const addBin = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { zoneIndex, zoneCode, rackIndex, rackCode, binCode, name, capacity, sku, productName } = req.body;
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return next(new AppError("Không tìm thấy kho hàng", 404));
        }

        const zone =
            zoneCode !== undefined
                ? warehouse.zones.find((z) => z.code === zoneCode || z.zoneName === zoneCode)
                : warehouse.zones[Number(zoneIndex)];

        if (!zone) {
            return next(new AppError("Không tìm thấy phân khu", 404));
        }

        const rack =
            rackCode !== undefined
                ? zone.racks.find((r) => r.rackCode === rackCode || (r.name && r.name.includes(rackCode)))
                : zone.racks[Number(rackIndex)];

        if (!rack) {
            return next(new AppError("Không tìm thấy dãy kệ", 404));
        }

        rack.bins.push({
            binCode: binCode || `B-0${rack.bins.length + 1}`,
            name: name || `Ô ${binCode || `B-0${rack.bins.length + 1}`}`,
            capacity: Number(capacity) || 100,
            currentOccupancy: 0,
            status: "AVAILABLE",
            sku: sku || "",
            productName: productName || "",
        });

        await warehouse.save();
        sendSuccess(res, warehouse, "Thêm ô chứa mới thành công");
    },
);

export const updateBin = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { binId, binCode, capacity, status, currentOccupancy, productId } = req.body;

        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return next(new AppError("Không tìm thấy kho hàng", 404));
        }

        let targetBin: any = null;
        for (const z of warehouse.zones) {
            for (const r of z.racks) {
                for (const b of r.bins) {
                    if ((binId && (b as any)._id?.toString() === binId) || (binCode && b.binCode === binCode)) {
                        targetBin = b;
                        break;
                    }
                }
                if (targetBin) break;
            }
            if (targetBin) break;
        }

        if (!targetBin) {
            return next(new AppError("Không tìm thấy ô chứa", 404));
        }

        if (capacity !== undefined) targetBin.capacity = Number(capacity);
        if (status !== undefined) targetBin.status = status;
        if (currentOccupancy !== undefined) targetBin.currentOccupancy = Number(currentOccupancy);

        if (productId) {
            const product = await Product.findById(productId);
            if (product) {
                targetBin.product = product._id as any;
                targetBin.productName = product.name;
                targetBin.sku = product.sku;
            }
        }

        await warehouse.save();
        sendSuccess(res, warehouse, "Cập nhật ô chứa thành công");
    },
);

export const relocateStock = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const fromWhId = req.body.sourceWarehouseId || req.body.fromWarehouseId;
        const toWhId = req.body.targetWarehouseId || req.body.toWarehouseId;
        const fromCode = req.body.sourceBinCode || req.body.fromBinCode;
        const toCode = req.body.targetBinCode || req.body.toBinCode;
        const moveQty = Number(req.body.quantity) || 1;
        const reason = req.body.reason || `Điều chuyển hàng từ ô ${fromCode} sang ô ${toCode}`;
        const performedBy = req.body.performedBy || "Quản trị viên";

        const sourceWarehouse = await Warehouse.findById(fromWhId);
        if (!sourceWarehouse) {
            return next(new AppError("Không tìm thấy kho xuất phát", 404));
        }

        let sourceBin: any = null;
        for (const z of sourceWarehouse.zones) {
            for (const r of z.racks) {
                for (const b of r.bins) {
                    if (b.binCode === fromCode) {
                        sourceBin = b;
                        break;
                    }
                }
                if (sourceBin) break;
            }
            if (sourceBin) break;
        }

        if (!sourceBin) {
            return next(new AppError(`Không tìm thấy ô xuất ${fromCode}`, 404));
        }

        let product: any = null;
        if (req.body.productId) {
            product = await Product.findById(req.body.productId);
        } else if (sourceBin.product) {
            product = await Product.findById(sourceBin.product);
        } else if (sourceBin.sku) {
            product = await Product.findOne({ sku: sourceBin.sku });
        }

        if (!product) {
            product = await Product.findOne();
        }

        sourceBin.currentOccupancy = Math.max(0, (sourceBin.currentOccupancy || 0) - moveQty);
        if (sourceBin.currentOccupancy === 0) {
            sourceBin.status = "AVAILABLE";
        }
        await sourceWarehouse.save();

        const targetWarehouse =
            fromWhId === toWhId
                ? sourceWarehouse
                : await Warehouse.findById(toWhId);

        if (targetWarehouse) {
            let targetBin: any = null;
            for (const z of targetWarehouse.zones) {
                for (const r of z.racks) {
                    for (const b of r.bins) {
                        if (b.binCode === toCode) {
                            targetBin = b;
                            break;
                        }
                    }
                    if (targetBin) break;
                }
                if (targetBin) break;
            }

            if (targetBin) {
                targetBin.currentOccupancy = (targetBin.currentOccupancy || 0) + moveQty;
                if (product) {
                    targetBin.product = product._id;
                    targetBin.productName = product.name;
                    targetBin.sku = product.sku;
                }
                targetBin.status =
                    targetBin.currentOccupancy >= targetBin.capacity ? "FULL" : "OCCUPIED";
                await targetWarehouse.save();
            }
        }

        const txCode = `TX-REL-${Date.now().toString().slice(-6)}`;
        await Transaction.create({
            transactionCode: txCode,
            type: "TRANSFER",
            product: product?._id,
            productName: product?.name || "Hàng hóa điều chuyển",
            sku: product?.sku || "SKU-REL",
            quantity: moveQty,
            warehouse: sourceWarehouse._id,
            warehouseName: `${sourceWarehouse.name} - Ô ${fromCode} chuyển sang ô ${toCode}`,
            beforeStock: product?.stock || 0,
            afterStock: product?.stock || 0,
            referenceCode: txCode,
            performedBy,
            reason,
        });

        await AuditLog.create({
            user: performedBy,
            userRole: "ADMIN",
            action: "ĐIỀU_CHUYỂN_HÀNG",
            resource: "Vị trí kho",
            resourceId: `${product?.sku || "SKU"} - ${fromCode} sang ${toCode}`,
            previousValue: `Ô nguồn ${fromCode}`,
            newValue: `Ô đích ${toCode}, số lượng ${moveQty}`,
        });

        sendSuccess(res, null, "Điều chuyển hàng hóa giữa các ô chứa thành công");
    },
);
