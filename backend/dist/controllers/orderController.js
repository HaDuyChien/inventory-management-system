"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrder = exports.cancelOrder = exports.updateOrderStatus = exports.createOrder = exports.getOrderById = exports.getOrders = void 0;
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const Supplier_1 = require("../models/Supplier");
const Warehouse_1 = require("../models/Warehouse");
const Transaction_1 = require("../models/Transaction");
const AuditLog_1 = require("../models/AuditLog");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
exports.getOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filter = {};
    if (req.query.type)
        filter.type = req.query.type;
    if (req.query.status)
        filter.status = req.query.status;
    if (req.query.paymentStatus)
        filter.paymentStatus = req.query.paymentStatus;
    if (req.query.paymentMethod)
        filter.paymentMethod = req.query.paymentMethod;
    if (req.query.customer)
        filter.customer = req.query.customer;
    if (req.query.phone) {
        filter.customerPhone = req.query.phone;
    }
    if (req.query.search) {
        const regex = new RegExp(String(req.query.search), "i");
        filter.$or = [
            { orderNumber: regex },
            { customerName: regex },
            { customerPhone: regex },
            { shippingAddress: regex },
        ];
    }
    const orders = await Order_1.Order.find(filter)
        .sort({ createdAt: -1 })
        .populate("customer", "name email phone")
        .populate("supplier", "name code email phone")
        .populate("warehouse", "name code");
    (0, response_1.sendSuccess)(res, orders, "Lấy danh sách đơn hàng thành công");
});
exports.getOrderById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const order = await Order_1.Order.findById(req.params.id)
        .populate("customer", "name email phone address")
        .populate("supplier", "name code email phone address")
        .populate("warehouse", "name code address");
    if (!order) {
        return next(new AppError_1.AppError("Không tìm thấy đơn hàng yêu cầu", 404));
    }
    (0, response_1.sendSuccess)(res, order, "Lấy thông tin đơn hàng thành công");
});
exports.createOrder = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const isSales = req.body.type === "SALES";
    const prefix = isSales ? "SO" : "PO";
    const orderNumber = req.body.orderNumber || `${prefix}-${Date.now().toString().slice(-6)}`;
    const rawItems = req.body.items || [];
    const items = rawItems.map((it) => ({
        product: it.product || it.productId,
        sku: it.sku || "",
        name: it.name || it.productName || "",
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: Number(it.totalPrice) || (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    }));
    if (items.length === 0) {
        return next(new AppError_1.AppError("Đơn hàng phải có ít nhất 1 sản phẩm", 400));
    }
    // Kiểm tra tồn kho trước khi tạo đơn bán hàng
    if (isSales) {
        for (const item of items) {
            if (!item.product) {
                return next(new AppError_1.AppError("Mỗi sản phẩm trong đơn phải có thông tin ID sản phẩm", 400));
            }
            const product = await Product_1.Product.findById(item.product);
            if (!product) {
                return next(new AppError_1.AppError(`Không tìm thấy sản phẩm ${item.name || item.sku || item.product}`, 404));
            }
            if (product.stock < item.quantity) {
                return next(new AppError_1.AppError(`Sản phẩm "${product.name}" hiện chỉ còn ${product.stock} trong kho, không đủ số lượng ${item.quantity} bạn đặt`, 400));
            }
        }
    }
    const totalAmount = req.body.totalAmount ||
        items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice) || 0), 0);
    let supplierName = req.body.supplierName || "";
    if (req.body.supplier && !supplierName) {
        const sup = await Supplier_1.Supplier.findById(req.body.supplier);
        if (sup)
            supplierName = sup.name;
    }
    let warehouseName = req.body.warehouseName || "";
    if (req.body.warehouse && !warehouseName) {
        const wh = await Warehouse_1.Warehouse.findById(req.body.warehouse);
        if (wh)
            warehouseName = wh.name;
    }
    const order = await Order_1.Order.create({
        ...req.body,
        items,
        orderNumber,
        totalAmount,
        supplierName,
        warehouseName,
    });
    // Trừ tồn kho và ghi nhận giao dịch xuất kho khi đặt đơn bán hàng thành công
    if (isSales) {
        for (const item of order.items) {
            const product = await Product_1.Product.findById(item.product);
            if (product) {
                const beforeStock = product.stock;
                const qty = Number(item.quantity) || 1;
                const afterStock = Math.max(0, beforeStock - qty);
                product.stock = afterStock;
                await product.save();
                const txCode = `TX-OUT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                await Transaction_1.Transaction.create({
                    transactionCode: txCode,
                    type: "OUTBOUND",
                    product: product._id,
                    productName: product.name,
                    sku: product.sku,
                    quantity: qty,
                    warehouse: order.warehouse || undefined,
                    warehouseName: order.warehouseName || "Kho Tổng Hà Nội",
                    beforeStock,
                    afterStock,
                    referenceCode: order.orderNumber,
                    performedBy: order.customerName || req.user?.name || "Khách hàng",
                    reason: `Xuất kho bán hàng theo đơn ${order.orderNumber}`,
                });
            }
        }
    }
    await AuditLog_1.AuditLog.create({
        user: order.customerName || req.user?.name || "Quản trị viên",
        userRole: req.user?.role || (isSales ? "CUSTOMER" : "ADMIN"),
        action: `TẠO_ĐƠN_${order.type}`,
        resource: order.type === "PURCHASE" ? "Đơn mua hàng" : "Đơn bán hàng",
        resourceId: order.orderNumber,
        previousValue: "Khởi tạo mới",
        newValue: `Tổng giá trị ${totalAmount} VND (${items.length} mặt hàng${isSales ? ", đã trừ kho" : ""})`,
    });
    (0, response_1.sendSuccess)(res, order, "Tạo đơn hàng thành công", 201);
});
exports.updateOrderStatus = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { status, paymentStatus, paymentMethod, notes } = req.body;
    const order = await Order_1.Order.findById(req.params.id);
    if (!order) {
        return next(new AppError_1.AppError("Không tìm thấy đơn hàng để cập nhật", 404));
    }
    const oldStatus = order.status;
    if (status)
        order.status = status;
    if (paymentStatus)
        order.paymentStatus = paymentStatus;
    if (paymentMethod)
        order.paymentMethod = paymentMethod;
    if (notes !== undefined)
        order.notes = notes;
    await order.save();
    // Nhập kho khi đơn mua hàng (PURCHASE) hoàn thành
    if (order.type === "PURCHASE" && status === "COMPLETED" && oldStatus !== "COMPLETED") {
        for (const item of order.items) {
            const product = await Product_1.Product.findById(item.product);
            if (product) {
                const beforeStock = product.stock;
                const qty = Number(item.quantity) || 1;
                const afterStock = beforeStock + qty;
                product.stock = afterStock;
                await product.save();
                const txCode = `TX-IN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                await Transaction_1.Transaction.create({
                    transactionCode: txCode,
                    type: "INBOUND",
                    product: product._id,
                    productName: product.name,
                    sku: product.sku,
                    quantity: qty,
                    warehouseName: order.warehouseName || "Kho Tổng Hà Nội",
                    beforeStock,
                    afterStock,
                    referenceCode: order.orderNumber,
                    performedBy: req.user?.name || "Quản trị viên",
                    reason: `Nhập kho từ đơn mua hàng ${order.orderNumber}`,
                });
            }
        }
        await AuditLog_1.AuditLog.create({
            user: req.user?.name || "Quản trị viên",
            userRole: "ADMIN",
            action: "HOÀN_TẤT_NHẬP_KHO",
            resource: "Đơn mua hàng",
            resourceId: order.orderNumber,
            previousValue: `Trạng thái: ${oldStatus}`,
            newValue: `Hoàn tất tiếp nhận hàng vào kho ${order.warehouseName || ""}`,
        });
    }
    // Hoàn kho khi đơn bán hàng (SALES) bị hủy
    if (order.type === "SALES" && status === "CANCELLED" && oldStatus !== "CANCELLED") {
        for (const item of order.items) {
            const product = await Product_1.Product.findById(item.product);
            if (product) {
                const beforeStock = product.stock;
                const qty = Number(item.quantity) || 1;
                const afterStock = beforeStock + qty;
                product.stock = afterStock;
                await product.save();
                const txCode = `TX-IN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                await Transaction_1.Transaction.create({
                    transactionCode: txCode,
                    type: "INBOUND",
                    product: product._id,
                    productName: product.name,
                    sku: product.sku,
                    quantity: qty,
                    warehouse: order.warehouse || undefined,
                    warehouseName: order.warehouseName || "Kho Tổng Hà Nội",
                    beforeStock,
                    afterStock,
                    referenceCode: order.orderNumber,
                    performedBy: req.user?.name || "Quản trị viên",
                    reason: `Hoàn kho do hủy đơn bán hàng ${order.orderNumber}`,
                });
            }
        }
    }
    // Trừ lại kho nếu đơn bán hàng bị hủy trước đó được khôi phục trạng thái hoạt động
    if (order.type === "SALES" && oldStatus === "CANCELLED" && status && status !== "CANCELLED") {
        for (const item of order.items) {
            const product = await Product_1.Product.findById(item.product);
            if (product) {
                const beforeStock = product.stock;
                const qty = Number(item.quantity) || 1;
                const afterStock = Math.max(0, beforeStock - qty);
                product.stock = afterStock;
                await product.save();
                const txCode = `TX-OUT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                await Transaction_1.Transaction.create({
                    transactionCode: txCode,
                    type: "OUTBOUND",
                    product: product._id,
                    productName: product.name,
                    sku: product.sku,
                    quantity: qty,
                    warehouse: order.warehouse || undefined,
                    warehouseName: order.warehouseName || "Kho Tổng Hà Nội",
                    beforeStock,
                    afterStock,
                    referenceCode: order.orderNumber,
                    performedBy: req.user?.name || "Quản trị viên",
                    reason: `Khôi phục đơn bán hàng ${order.orderNumber} từ trạng thái hủy`,
                });
            }
        }
    }
    (0, response_1.sendSuccess)(res, order, "Cập nhật trạng thái đơn hàng thành công");
});
exports.cancelOrder = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const order = await Order_1.Order.findById(req.params.id);
    if (!order) {
        return next(new AppError_1.AppError("Không tìm thấy đơn hàng yêu cầu", 404));
    }
    if (order.status !== "PENDING" && order.status !== "DRAFT") {
        return next(new AppError_1.AppError("Không thể hủy đơn hàng đã xác nhận hoặc đang vận chuyển", 400));
    }
    const oldStatus = order.status;
    order.status = "CANCELLED";
    if (req.body.notes) {
        order.notes = req.body.notes;
    }
    await order.save();
    // Hoàn kho cho đơn bán hàng
    if (order.type === "SALES") {
        for (const item of order.items) {
            const product = await Product_1.Product.findById(item.product);
            if (product) {
                const beforeStock = product.stock;
                const qty = Number(item.quantity) || 1;
                const afterStock = beforeStock + qty;
                product.stock = afterStock;
                await product.save();
                const txCode = `TX-IN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                await Transaction_1.Transaction.create({
                    transactionCode: txCode,
                    type: "INBOUND",
                    product: product._id,
                    productName: product.name,
                    sku: product.sku,
                    quantity: qty,
                    warehouse: order.warehouse || undefined,
                    warehouseName: order.warehouseName || "Kho Tổng Hà Nội",
                    beforeStock,
                    afterStock,
                    referenceCode: order.orderNumber,
                    performedBy: req.body.performedBy || order.customerName || "Khách hàng",
                    reason: `Hoàn kho do hủy đơn bán hàng ${order.orderNumber}`,
                });
            }
        }
    }
    await AuditLog_1.AuditLog.create({
        user: order.customerName || "Khách hàng",
        userRole: "CUSTOMER",
        action: "HUY_DON_HANG",
        resource: "Đơn bán hàng",
        resourceId: order.orderNumber,
        previousValue: oldStatus,
        newValue: "Đã hủy theo yêu cầu của khách hàng (Đã hoàn trả tồn kho)",
    });
    (0, response_1.sendSuccess)(res, order, "Đã hủy đơn hàng thành công");
});
exports.deleteOrder = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const order = await Order_1.Order.findById(req.params.id);
    if (!order) {
        return next(new AppError_1.AppError("Không tìm thấy đơn hàng để xóa", 404));
    }
    if (order.status === "COMPLETED") {
        return next(new AppError_1.AppError("Không thể xóa đơn hàng đã hoàn tất", 400));
    }
    // Nếu xóa đơn bán hàng chưa bị hủy trước đó thì hoàn lại tồn kho
    if (order.type === "SALES" && order.status !== "CANCELLED") {
        for (const item of order.items) {
            const product = await Product_1.Product.findById(item.product);
            if (product) {
                const beforeStock = product.stock;
                const qty = Number(item.quantity) || 1;
                const afterStock = beforeStock + qty;
                product.stock = afterStock;
                await product.save();
                const txCode = `TX-IN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                await Transaction_1.Transaction.create({
                    transactionCode: txCode,
                    type: "INBOUND",
                    product: product._id,
                    productName: product.name,
                    sku: product.sku,
                    quantity: qty,
                    warehouse: order.warehouse || undefined,
                    warehouseName: order.warehouseName || "Kho Tổng Hà Nội",
                    beforeStock,
                    afterStock,
                    referenceCode: order.orderNumber,
                    performedBy: req.user?.name || "Quản trị viên",
                    reason: `Hoàn kho do xóa đơn bán hàng ${order.orderNumber}`,
                });
            }
        }
    }
    await Order_1.Order.findByIdAndDelete(req.params.id);
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: "ADMIN",
        action: `XÓA_ĐƠN_${order.type}`,
        resource: order.type === "PURCHASE" ? "Đơn mua hàng" : "Đơn bán hàng",
        resourceId: order.orderNumber,
        previousValue: `Mã đơn: ${order.orderNumber}`,
        newValue: "Đã xóa khỏi hệ thống",
    });
    (0, response_1.sendSuccess)(res, null, "Xóa đơn hàng thành công");
});
