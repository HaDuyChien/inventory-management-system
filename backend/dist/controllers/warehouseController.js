"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relocateStock = exports.updateBin = exports.addBin = exports.addRack = exports.addZone = exports.deleteWarehouse = exports.updateWarehouse = exports.createWarehouse = exports.getWarehouseById = exports.getWarehouses = void 0;
const Warehouse_1 = require("../models/Warehouse");
const Product_1 = require("../models/Product");
const Transaction_1 = require("../models/Transaction");
const AuditLog_1 = require("../models/AuditLog");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
exports.getWarehouses = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const warehouses = await Warehouse_1.Warehouse.find().sort({ createdAt: -1 });
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
    (0, response_1.sendSuccess)(res, enriched, "Lấy danh sách kho hàng thành công");
});
exports.getWarehouseById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const warehouse = await Warehouse_1.Warehouse.findById(req.params.id);
    if (!warehouse) {
        return next(new AppError_1.AppError("Không tìm thấy kho hàng yêu cầu", 404));
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
        occupancyRate: warehouse.capacity > 0 ? Math.round((totalOccupancy / warehouse.capacity) * 100) : 0,
    };
    (0, response_1.sendSuccess)(res, result, "Lấy thông tin chi tiết kho hàng thành công");
});
exports.createWarehouse = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const existing = await Warehouse_1.Warehouse.findOne({
        $or: [{ name: req.body.name }, { code: req.body.code?.toUpperCase() }],
    });
    if (existing) {
        return next(new AppError_1.AppError("Tên kho hoặc mã kho đã tồn tại trong hệ thống", 400));
    }
    const warehouse = await Warehouse_1.Warehouse.create({
        ...req.body,
        code: req.body.code?.toUpperCase(),
    });
    (0, response_1.sendSuccess)(res, warehouse, "Tạo mới kho hàng thành công", 201);
});
exports.updateWarehouse = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const warehouse = await Warehouse_1.Warehouse.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!warehouse) {
        return next(new AppError_1.AppError("Không tìm thấy kho hàng để cập nhật", 404));
    }
    (0, response_1.sendSuccess)(res, warehouse, "Cập nhật thông tin kho hàng thành công");
});
exports.deleteWarehouse = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const warehouse = await Warehouse_1.Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) {
        return next(new AppError_1.AppError("Không tìm thấy kho hàng để xóa", 404));
    }
    (0, response_1.sendSuccess)(res, null, "Xóa kho hàng thành công");
});
exports.addZone = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { zoneName, code } = req.body;
    const warehouse = await Warehouse_1.Warehouse.findById(req.params.id);
    if (!warehouse) {
        return next(new AppError_1.AppError("Không tìm thấy kho hàng", 404));
    }
    warehouse.zones.push({
        zoneName,
        code: code || `Z-0${warehouse.zones.length + 1}`,
        racks: [],
    });
    await warehouse.save();
    (0, response_1.sendSuccess)(res, warehouse, "Thêm phân khu mới thành công");
});
exports.addRack = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { zoneIndex, zoneCode, rackCode, name } = req.body;
    const warehouse = await Warehouse_1.Warehouse.findById(req.params.id);
    if (!warehouse) {
        return next(new AppError_1.AppError("Không tìm thấy kho hàng", 404));
    }
    const zone = zoneCode !== undefined
        ? warehouse.zones.find((z) => z.code === zoneCode || z.zoneName === zoneCode)
        : warehouse.zones[Number(zoneIndex)];
    if (!zone) {
        return next(new AppError_1.AppError("Không tìm thấy phân khu chỉ định", 404));
    }
    zone.racks.push({
        rackCode: rackCode || `R-0${zone.racks.length + 1}`,
        name: name || `Kệ ${rackCode || `R-0${zone.racks.length + 1}`}`,
        bins: [],
    });
    await warehouse.save();
    (0, response_1.sendSuccess)(res, warehouse, "Thêm dãy kệ thành công");
});
exports.addBin = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { zoneIndex, zoneCode, rackIndex, rackCode, binCode, name, capacity, sku, productName } = req.body;
    const warehouse = await Warehouse_1.Warehouse.findById(req.params.id);
    if (!warehouse) {
        return next(new AppError_1.AppError("Không tìm thấy kho hàng", 404));
    }
    const zone = zoneCode !== undefined
        ? warehouse.zones.find((z) => z.code === zoneCode || z.zoneName === zoneCode)
        : warehouse.zones[Number(zoneIndex)];
    if (!zone) {
        return next(new AppError_1.AppError("Không tìm thấy phân khu", 404));
    }
    const rack = rackCode !== undefined
        ? zone.racks.find((r) => r.rackCode === rackCode || (r.name && r.name.includes(rackCode)))
        : zone.racks[Number(rackIndex)];
    if (!rack) {
        return next(new AppError_1.AppError("Không tìm thấy dãy kệ", 404));
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
    (0, response_1.sendSuccess)(res, warehouse, "Thêm ô chứa mới thành công");
});
exports.updateBin = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { binId, binCode, capacity, status, currentOccupancy, productId } = req.body;
    const warehouse = await Warehouse_1.Warehouse.findById(req.params.id);
    if (!warehouse) {
        return next(new AppError_1.AppError("Không tìm thấy kho hàng", 404));
    }
    let targetBin = null;
    for (const z of warehouse.zones) {
        for (const r of z.racks) {
            for (const b of r.bins) {
                if ((binId && b._id?.toString() === binId) || (binCode && b.binCode === binCode)) {
                    targetBin = b;
                    break;
                }
            }
            if (targetBin)
                break;
        }
        if (targetBin)
            break;
    }
    if (!targetBin) {
        return next(new AppError_1.AppError("Không tìm thấy ô chứa", 404));
    }
    if (capacity !== undefined)
        targetBin.capacity = Number(capacity);
    if (status !== undefined)
        targetBin.status = status;
    if (currentOccupancy !== undefined)
        targetBin.currentOccupancy = Number(currentOccupancy);
    if (productId) {
        const product = await Product_1.Product.findById(productId);
        if (product) {
            targetBin.product = product._id;
            targetBin.productName = product.name;
            targetBin.sku = product.sku;
        }
    }
    await warehouse.save();
    (0, response_1.sendSuccess)(res, warehouse, "Cập nhật ô chứa thành công");
});
exports.relocateStock = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const fromWhId = req.body.sourceWarehouseId || req.body.fromWarehouseId;
    const toWhId = req.body.targetWarehouseId || req.body.toWarehouseId;
    const fromCode = req.body.sourceBinCode || req.body.fromBinCode;
    const toCode = req.body.targetBinCode || req.body.toBinCode;
    const moveQty = Number(req.body.quantity) || 1;
    const reason = req.body.reason || `Điều chuyển hàng từ ô ${fromCode} sang ô ${toCode}`;
    const performedBy = req.body.performedBy || "Quản trị viên";
    const sourceWarehouse = await Warehouse_1.Warehouse.findById(fromWhId);
    if (!sourceWarehouse) {
        return next(new AppError_1.AppError("Không tìm thấy kho xuất phát", 404));
    }
    let sourceBin = null;
    for (const z of sourceWarehouse.zones) {
        for (const r of z.racks) {
            for (const b of r.bins) {
                if (b.binCode === fromCode) {
                    sourceBin = b;
                    break;
                }
            }
            if (sourceBin)
                break;
        }
        if (sourceBin)
            break;
    }
    if (!sourceBin) {
        return next(new AppError_1.AppError(`Không tìm thấy ô xuất ${fromCode}`, 404));
    }
    let product = null;
    if (req.body.productId) {
        product = await Product_1.Product.findById(req.body.productId);
    }
    else if (sourceBin.product) {
        product = await Product_1.Product.findById(sourceBin.product);
    }
    else if (sourceBin.sku) {
        product = await Product_1.Product.findOne({ sku: sourceBin.sku });
    }
    if (!product) {
        product = await Product_1.Product.findOne();
    }
    sourceBin.currentOccupancy = Math.max(0, (sourceBin.currentOccupancy || 0) - moveQty);
    if (sourceBin.currentOccupancy === 0) {
        sourceBin.status = "AVAILABLE";
    }
    await sourceWarehouse.save();
    const targetWarehouse = fromWhId === toWhId
        ? sourceWarehouse
        : await Warehouse_1.Warehouse.findById(toWhId);
    if (targetWarehouse) {
        let targetBin = null;
        for (const z of targetWarehouse.zones) {
            for (const r of z.racks) {
                for (const b of r.bins) {
                    if (b.binCode === toCode) {
                        targetBin = b;
                        break;
                    }
                }
                if (targetBin)
                    break;
            }
            if (targetBin)
                break;
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
    await Transaction_1.Transaction.create({
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
    await AuditLog_1.AuditLog.create({
        user: performedBy,
        userRole: "ADMIN",
        action: "ĐIỀU_CHUYỂN_HÀNG",
        resource: "Vị trí kho",
        resourceId: `${product?.sku || "SKU"} - ${fromCode} sang ${toCode}`,
        previousValue: `Ô nguồn ${fromCode}`,
        newValue: `Ô đích ${toCode}, số lượng ${moveQty}`,
    });
    (0, response_1.sendSuccess)(res, null, "Điều chuyển hàng hóa giữa các ô chứa thành công");
});
