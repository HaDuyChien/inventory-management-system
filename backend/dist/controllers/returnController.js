"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReturn = exports.updateReturnStatus = exports.createReturn = exports.getReturnById = exports.getReturns = void 0;
const Return_1 = require("../models/Return");
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const Transaction_1 = require("../models/Transaction");
const AuditLog_1 = require("../models/AuditLog");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
exports.getReturns = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filter = {};
    if (req.query.status && req.query.status !== "ALL") {
        filter.status = req.query.status;
    }
    if (req.query.refundStatus && req.query.refundStatus !== "ALL") {
        filter.refundStatus = req.query.refundStatus;
    }
    if (req.query.search) {
        const regex = new RegExp(String(req.query.search), "i");
        filter.$or = [
            { rmaNumber: regex },
            { orderNumber: regex },
            { customerName: regex },
            { customerPhone: regex },
            { returnReason: regex },
        ];
    }
    const returns = await Return_1.Return.find(filter)
        .sort({ createdAt: -1 })
        .populate("order", "orderNumber totalAmount paymentStatus")
        .populate("items.product", "name sku price costPrice thumbnail");
    (0, response_1.sendSuccess)(res, returns, "Lấy danh sách phiếu trả hàng thành công");
});
exports.getReturnById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const returnDoc = await Return_1.Return.findById(req.params.id)
        .populate("order")
        .populate("items.product");
    if (!returnDoc) {
        return next(new AppError_1.AppError("Không tìm thấy phiếu trả hàng yêu cầu", 404));
    }
    (0, response_1.sendSuccess)(res, returnDoc, "Lấy chi tiết phiếu trả hàng thành công");
});
exports.createReturn = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { orderNumber, customerName, customerPhone, warehouseName, items, returnReason, notes, } = req.body;
    if (!orderNumber || !items || !Array.isArray(items) || items.length === 0) {
        return next(new AppError_1.AppError("Vui lòng cung cấp mã đơn hàng và danh sách sản phẩm trả", 400));
    }
    const order = await Order_1.Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() });
    const count = await Return_1.Return.countDocuments();
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(3, "0");
    const rmaNumber = `RMA-${year}-${seq}`;
    let calculatedRefund = 0;
    const mappedItems = items.map((it) => {
        const refund = Number(it.refundAmount ?? it.quantity * it.unitPrice);
        calculatedRefund += refund;
        return {
            product: it.productId || it.product,
            sku: it.sku,
            name: it.name,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            refundAmount: refund,
            reason: it.reason || returnReason,
        };
    });
    const newReturn = await Return_1.Return.create({
        rmaNumber,
        order: order ? order._id : undefined,
        orderNumber: orderNumber.trim().toUpperCase(),
        customer: order ? order.customer : undefined,
        customerName: customerName || (order ? order.customerName : "Khách hàng"),
        customerPhone: customerPhone || (order ? order.customerPhone : ""),
        warehouse: order ? order.warehouse : undefined,
        warehouseName: warehouseName || (order ? order.warehouseName : "Kho Tổng Hà Nội"),
        items: mappedItems,
        returnReason: returnReason || "Khách yêu cầu trả hàng",
        status: "PENDING",
        refundStatus: "PENDING",
        totalRefundAmount: calculatedRefund,
        inspectionNotes: notes || "",
        performedBy: req.user?.name || "Quản trị viên",
    });
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "TAO_PHIEU_TRA_HANG",
        resource: "Trả hàng",
        resourceId: rmaNumber,
        previousValue: `Đơn gốc: ${orderNumber}`,
        newValue: `Tạo phiếu RMA hoàn tiền: ${calculatedRefund.toLocaleString("vi-VN")} đ`,
    });
    (0, response_1.sendSuccess)(res, newReturn, "Tạo phiếu trả hàng thành công", 201);
});
exports.updateReturnStatus = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { status, refundStatus, inspectionNotes } = req.body;
    const returnDoc = await Return_1.Return.findById(req.params.id);
    if (!returnDoc) {
        return next(new AppError_1.AppError("Không tìm thấy phiếu trả hàng cần cập nhật", 404));
    }
    const oldStatus = returnDoc.status;
    const oldRefund = returnDoc.refundStatus;
    if (status)
        returnDoc.status = status;
    if (refundStatus)
        returnDoc.refundStatus = refundStatus;
    if (inspectionNotes !== undefined)
        returnDoc.inspectionNotes = inspectionNotes;
    returnDoc.performedBy = req.user?.name || returnDoc.performedBy;
    await returnDoc.save();
    if (status === "RESTOCKED" && oldStatus !== "RESTOCKED") {
        for (const item of returnDoc.items) {
            const product = await Product_1.Product.findById(item.product);
            if (product) {
                const beforeStock = product.stock;
                const afterStock = beforeStock + Number(item.quantity);
                product.stock = afterStock;
                await product.save();
                const txCode = `TX-RET-${Date.now().toString().slice(-6)}`;
                await Transaction_1.Transaction.create({
                    transactionCode: txCode,
                    type: "INBOUND",
                    product: product._id,
                    productName: product.name,
                    sku: product.sku,
                    quantity: Number(item.quantity),
                    warehouseName: returnDoc.warehouseName || "Kho Tổng Hà Nội",
                    beforeStock,
                    afterStock,
                    referenceCode: returnDoc.rmaNumber,
                    performedBy: req.user?.name || "Nhân viên kho",
                    reason: `Nhập lại kho từ phiếu đổi trả ${returnDoc.rmaNumber} của đơn ${returnDoc.orderNumber}`,
                });
            }
        }
        await AuditLog_1.AuditLog.create({
            user: req.user?.name || "Nhân viên kho",
            userRole: req.user?.role || "ADMIN",
            action: "NHAP_LAI_KHO_TRA_HANG",
            resource: "Trả hàng",
            resourceId: returnDoc.rmaNumber,
            previousValue: `Trạng thái cũ: ${oldStatus}`,
            newValue: `Hoàn tất nhập lại tồn kho cho phiếu ${returnDoc.rmaNumber}`,
        });
    }
    (0, response_1.sendSuccess)(res, returnDoc, "Cập nhật trạng thái phiếu trả hàng thành công");
});
exports.deleteReturn = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const returnDoc = await Return_1.Return.findById(req.params.id);
    if (!returnDoc) {
        return next(new AppError_1.AppError("Không tìm thấy phiếu trả hàng để xóa", 404));
    }
    if (returnDoc.status === "RESTOCKED") {
        return next(new AppError_1.AppError("Không thể xóa phiếu trả hàng đã hoàn tất nhập lại kho", 400));
    }
    await Return_1.Return.findByIdAndDelete(req.params.id);
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "XOA_PHIEU_TRA_HANG",
        resource: "Trả hàng",
        resourceId: returnDoc.rmaNumber,
        previousValue: returnDoc.status,
        newValue: "Đã xóa khỏi hệ thống",
    });
    (0, response_1.sendSuccess)(res, null, "Xóa phiếu trả hàng thành công");
});
