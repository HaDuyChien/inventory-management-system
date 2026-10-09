"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vnpayIPN = exports.verifyVNPayReturn = exports.createVNPayPaymentUrl = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Order_1 = require("../models/Order");
const AuditLog_1 = require("../models/AuditLog");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
const vnpayService_1 = require("../services/vnpayService");
exports.createVNPayPaymentUrl = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { orderId, orderNumber } = req.body;
    if (!orderId && !orderNumber) {
        return next(new AppError_1.AppError("Thiếu thông tin mã đơn hàng cần thanh toán", 400));
    }
    let order = null;
    if (orderNumber) {
        order = await Order_1.Order.findOne({ orderNumber: String(orderNumber).trim() });
    }
    if (!order && orderId) {
        const cleanId = String(orderId).trim();
        if (mongoose_1.default.Types.ObjectId.isValid(cleanId)) {
            order = await Order_1.Order.findById(cleanId);
        }
        else {
            order = await Order_1.Order.findOne({ orderNumber: cleanId });
        }
    }
    if (!order) {
        return next(new AppError_1.AppError("Không tìm thấy đơn hàng yêu cầu", 404));
    }
    if (order.paymentStatus === "PAID") {
        return next(new AppError_1.AppError("Đơn hàng này đã được thanh toán thành công trước đó", 400));
    }
    const forwarded = req.headers["x-forwarded-for"];
    const ipAddr = typeof forwarded === "string"
        ? forwarded.split(",")[0].trim()
        : req.socket.remoteAddress || "127.0.0.1";
    const paymentUrl = (0, vnpayService_1.createPaymentUrl)(order, ipAddr);
    order.paymentMethod = "VNPAY";
    await order.save();
    (0, response_1.sendSuccess)(res, {
        paymentUrl,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
    }, "Tạo liên kết thanh toán VNPay thành công");
});
exports.verifyVNPayReturn = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const queryParams = { ...req.query, ...req.body };
    const result = (0, vnpayService_1.verifyReturnUrl)(queryParams);
    if (!result.orderNumber) {
        return next(new AppError_1.AppError("Mã đơn hàng không hợp lệ trong kết quả VNPay", 400));
    }
    const order = await Order_1.Order.findOne({ orderNumber: result.orderNumber });
    if (!order) {
        return next(new AppError_1.AppError("Không tìm thấy đơn hàng khớp với giao dịch", 404));
    }
    if (result.isSuccess) {
        order.paymentStatus = "PAID";
        if (order.status === "PENDING" || order.status === "DRAFT") {
            order.status = "CONFIRMED";
        }
        order.paymentMethod = "VNPAY";
        if (result.transactionNo) {
            order.vnpTransactionNo = result.transactionNo;
        }
        if (result.bankCode) {
            order.vnpBankCode = result.bankCode;
        }
        if (result.payDate) {
            order.vnpPayDate = result.payDate;
        }
        await order.save();
        await AuditLog_1.AuditLog.create({
            user: order.customerName || "Khách hàng",
            userRole: "CUSTOMER",
            action: "THANH_TOAN_VNPAY_THANH_CONG",
            resource: "Đơn bán hàng",
            resourceId: order.orderNumber,
            previousValue: "Chờ thanh toán",
            newValue: `Đã thanh toán ${result.amount} VND qua VNPay`,
        });
    }
    else {
        order.paymentStatus = "PENDING";
        order.paymentMethod = "VNPAY";
        if (result.transactionNo) {
            order.vnpTransactionNo = result.transactionNo;
        }
        if (result.bankCode) {
            order.vnpBankCode = result.bankCode;
        }
        await order.save();
    }
    (0, response_1.sendSuccess)(res, {
        ...result,
        order: {
            id: order._id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            shippingAddress: order.shippingAddress,
            items: order.items,
        },
    }, "Xử lý kết quả thanh toán VNPay thành công");
});
exports.vnpayIPN = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = { ...req.query, ...req.body };
    const result = (0, vnpayService_1.verifyReturnUrl)(queryParams);
    if (!result.isValid) {
        res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
        return;
    }
    const order = await Order_1.Order.findOne({ orderNumber: result.orderNumber });
    if (!order) {
        res.status(200).json({ RspCode: "01", Message: "Order not found" });
        return;
    }
    if (order.paymentStatus === "PAID") {
        res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
        return;
    }
    if (result.isSuccess) {
        order.paymentStatus = "PAID";
        if (order.status === "PENDING" || order.status === "DRAFT") {
            order.status = "CONFIRMED";
        }
        order.paymentMethod = "VNPAY";
        if (result.transactionNo) {
            order.vnpTransactionNo = result.transactionNo;
        }
        if (result.bankCode) {
            order.vnpBankCode = result.bankCode;
        }
        if (result.payDate) {
            order.vnpPayDate = result.payDate;
        }
        await order.save();
        await AuditLog_1.AuditLog.create({
            user: "Hệ thống VNPay",
            userRole: "SYSTEM",
            action: "XAC_NHAN_IPN_VNPAY",
            resource: "Đơn bán hàng",
            resourceId: order.orderNumber,
            previousValue: "Chờ thanh toán",
            newValue: `Đã thanh toán ${result.amount} VND qua VNPay IPN`,
        });
    }
    res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
});
