"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.paySupplierOrder = exports.getSupplierOrders = exports.getSupplierById = exports.getSupplierStats = exports.getSuppliers = void 0;
const Supplier_1 = require("../models/Supplier");
const Order_1 = require("../models/Order");
const AuditLog_1 = require("../models/AuditLog");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
exports.getSuppliers = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const suppliers = await Supplier_1.Supplier.find().sort({ createdAt: -1 });
    const orders = await Order_1.Order.find({ type: "PURCHASE" });
    const enriched = suppliers.map((s) => {
        const supOrders = orders.filter((o) => (o.supplier && o.supplier.toString() === s._id.toString()) ||
            o.supplierName === s.name);
        const activeOrders = supOrders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length;
        const totalSpend = supOrders
            .filter((o) => o.status !== "CANCELLED")
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        const unpaidDebt = supOrders
            .filter((o) => o.status !== "CANCELLED" && o.paymentStatus === "PENDING")
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        return {
            ...s.toObject(),
            activeOrders,
            totalSpend,
            unpaidDebt,
        };
    });
    (0, response_1.sendSuccess)(res, enriched, "Lấy danh sách nhà cung cấp thành công");
});
exports.getSupplierStats = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const suppliers = await Supplier_1.Supplier.find();
    const orders = await Order_1.Order.find({ type: "PURCHASE" });
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.status === "ACTIVE").length;
    const totalSpend = orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const totalUnpaidDebt = orders
        .filter((o) => o.status !== "CANCELLED" && o.paymentStatus === "PENDING")
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const activeOrdersCount = orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "SHIPPING").length;
    (0, response_1.sendSuccess)(res, {
        totalSuppliers,
        activeSuppliers,
        totalSpend,
        totalUnpaidDebt,
        activeOrdersCount,
    }, "Lấy số liệu thống kê nhà cung cấp thành công");
});
exports.getSupplierById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const supplier = await Supplier_1.Supplier.findById(req.params.id);
    if (!supplier) {
        return next(new AppError_1.AppError("Không tìm thấy nhà cung cấp", 404));
    }
    const orders = await Order_1.Order.find({
        type: "PURCHASE",
        $or: [{ supplier: supplier._id }, { supplierName: supplier.name }],
    });
    const activeOrders = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length;
    const totalSpend = orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const unpaidDebt = orders
        .filter((o) => o.status !== "CANCELLED" && o.paymentStatus === "PENDING")
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    (0, response_1.sendSuccess)(res, {
        ...supplier.toObject(),
        activeOrders,
        totalSpend,
        unpaidDebt,
    }, "Lấy thông tin nhà cung cấp thành công");
});
exports.getSupplierOrders = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const supplier = await Supplier_1.Supplier.findById(req.params.id);
    if (!supplier) {
        return next(new AppError_1.AppError("Không tìm thấy nhà cung cấp", 404));
    }
    const orders = await Order_1.Order.find({
        type: "PURCHASE",
        $or: [{ supplier: supplier._id }, { supplierName: supplier.name }],
    }).sort({ createdAt: -1 });
    (0, response_1.sendSuccess)(res, orders, "Lấy danh sách đơn mua hàng của nhà cung cấp thành công");
});
exports.paySupplierOrder = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { orderId } = req.params;
    const order = await Order_1.Order.findOne({
        _id: orderId,
        type: "PURCHASE",
    });
    if (!order) {
        return next(new AppError_1.AppError("Không tìm thấy đơn mua hàng cần thanh toán", 404));
    }
    order.paymentStatus = "PAID";
    await order.save();
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "THANH_TOÁN_CÔNG_NỢ_NCC",
        resource: "Đơn mua hàng",
        resourceId: order.orderNumber,
        previousValue: "Chưa thanh toán",
        newValue: `Đã thanh toán toàn bộ công nợ trị giá ${order.totalAmount} đồng`,
    });
    (0, response_1.sendSuccess)(res, order, "Thanh toán công nợ đơn hàng thành công");
});
exports.createSupplier = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const existing = await Supplier_1.Supplier.findOne({
        $or: [{ name: req.body.name }, { code: req.body.code?.toUpperCase() }],
    });
    if (existing) {
        return next(new AppError_1.AppError("Tên hoặc mã nhà cung cấp đã tồn tại trong hệ thống", 400));
    }
    const supplier = await Supplier_1.Supplier.create({
        ...req.body,
        code: req.body.code?.toUpperCase(),
    });
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "TẠO_NHÀ_CUNG_CẤP",
        resource: "Nhà cung cấp",
        resourceId: `${supplier.name} - ${supplier.code}`,
        previousValue: "Khởi tạo mới",
        newValue: `Email ${supplier.email}, SĐT ${supplier.phone}`,
    });
    (0, response_1.sendSuccess)(res, supplier, "Thêm mới nhà cung cấp thành công", 201);
});
exports.updateSupplier = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const supplier = await Supplier_1.Supplier.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!supplier) {
        return next(new AppError_1.AppError("Không tìm thấy nhà cung cấp để cập nhật", 404));
    }
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "CẬP_NHẬT_NHÀ_CUNG_CẤP",
        resource: "Nhà cung cấp",
        resourceId: `${supplier.name} - ${supplier.code}`,
        previousValue: "Cập nhật thông tin",
        newValue: `Cập nhật dữ liệu nhà cung cấp ${supplier.name}`,
    });
    (0, response_1.sendSuccess)(res, supplier, "Cập nhật thông tin nhà cung cấp thành công");
});
exports.deleteSupplier = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const supplier = await Supplier_1.Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
        return next(new AppError_1.AppError("Không tìm thấy nhà cung cấp để xóa", 404));
    }
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "XÓA_NHÀ_CUNG_CẤP",
        resource: "Nhà cung cấp",
        resourceId: `${supplier.name} - ${supplier.code}`,
        previousValue: "Tồn tại",
        newValue: "Đã xóa khỏi hệ thống",
    });
    (0, response_1.sendSuccess)(res, null, "Xóa nhà cung cấp thành công");
});
