"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = void 0;
const Customer_1 = require("../models/Customer");
const Order_1 = require("../models/Order");
const AuditLog_1 = require("../models/AuditLog");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
exports.getCustomers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filter = {};
    if (req.query.segment && req.query.segment !== "ALL") {
        filter.segment = req.query.segment;
    }
    if (req.query.status && req.query.status !== "ALL") {
        filter.status = req.query.status;
    }
    if (req.query.search) {
        const regex = new RegExp(String(req.query.search), "i");
        filter.$or = [
            { name: regex },
            { email: regex },
            { phone: regex },
            { address: regex },
        ];
    }
    const customers = await Customer_1.Customer.find(filter).sort({ createdAt: -1 });
    const enrichedCustomers = await Promise.all(customers.map(async (c) => {
        const customerOrders = await Order_1.Order.find({
            type: "SALES",
            $or: [
                { customer: c._id },
                { customerPhone: c.phone },
                { customerEmail: c.email },
            ],
        });
        const computedTotalOrders = customerOrders.length;
        const computedTotalSpent = customerOrders
            .filter((o) => o.status !== "CANCELLED")
            .reduce((sum, o) => sum + o.totalAmount, 0);
        const lastOrder = customerOrders[0];
        return {
            _id: c._id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address || "",
            segment: c.segment,
            totalOrders: computedTotalOrders || c.totalOrders,
            totalSpent: computedTotalSpent || c.totalSpent,
            status: c.status,
            lastOrderDate: lastOrder ? lastOrder.createdAt : c.createdAt,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        };
    }));
    (0, response_1.sendSuccess)(res, enrichedCustomers, "Lấy danh sách khách hàng thành công");
});
exports.getCustomerById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const customer = await Customer_1.Customer.findById(req.params.id);
    if (!customer) {
        return next(new AppError_1.AppError("Không tìm thấy khách hàng yêu cầu", 404));
    }
    const orders = await Order_1.Order.find({
        type: "SALES",
        $or: [
            { customer: customer._id },
            { customerPhone: customer.phone },
            { customerEmail: customer.email },
        ],
    }).sort({ createdAt: -1 });
    const totalSpent = orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + o.totalAmount, 0);
    (0, response_1.sendSuccess)(res, {
        customer,
        orders,
        metrics: {
            totalOrders: orders.length,
            totalSpent,
            lastOrderDate: orders[0] ? orders[0].createdAt : null,
        },
    }, "Lấy thông tin khách hàng thành công");
});
exports.createCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { name, email, phone, address, segment, password } = req.body;
    const existing = await Customer_1.Customer.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
        return next(new AppError_1.AppError("Email này đã được đăng ký bởi khách hàng khác", 400));
    }
    const customer = await Customer_1.Customer.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        address: address ? address.trim() : "",
        segment: segment || "NEW",
        password: password || "Customer@123",
        status: "ACTIVE",
        totalOrders: 0,
        totalSpent: 0,
    });
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "THEM_KHACH_HANG",
        resource: "Khách hàng",
        resourceId: customer.name,
        previousValue: "Trống",
        newValue: `Tên: ${customer.name} - Email: ${customer.email}`,
    });
    (0, response_1.sendSuccess)(res, customer, "Thêm khách hàng mới thành công", 201);
});
exports.updateCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { name, phone, address, segment, status } = req.body;
    const customer = await Customer_1.Customer.findById(req.params.id);
    if (!customer) {
        return next(new AppError_1.AppError("Không tìm thấy khách hàng cần cập nhật", 404));
    }
    const oldValues = `Phân khúc: ${customer.segment} - Trạng thái: ${customer.status}`;
    if (name)
        customer.name = name.trim();
    if (phone)
        customer.phone = phone.trim();
    if (address !== undefined)
        customer.address = address.trim();
    if (segment)
        customer.segment = segment;
    if (status)
        customer.status = status;
    await customer.save();
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "CAP_NHAT_KHACH_HANG",
        resource: "Khách hàng",
        resourceId: customer.name,
        previousValue: oldValues,
        newValue: `Phân khúc: ${customer.segment} - Trạng thái: ${customer.status}`,
    });
    (0, response_1.sendSuccess)(res, customer, "Cập nhật thông tin khách hàng thành công");
});
exports.deleteCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const customer = await Customer_1.Customer.findById(req.params.id);
    if (!customer) {
        return next(new AppError_1.AppError("Không tìm thấy khách hàng để xóa", 404));
    }
    const ordersCount = await Order_1.Order.countDocuments({
        $or: [
            { customer: customer._id },
            { customerPhone: customer.phone },
        ],
    });
    if (ordersCount > 0) {
        return next(new AppError_1.AppError("Không thể xóa khách hàng đã có đơn hàng trong hệ thống. Vui lòng chuyển trạng thái sang Đã khóa", 400));
    }
    await Customer_1.Customer.findByIdAndDelete(req.params.id);
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "XOA_KHACH_HANG",
        resource: "Khách hàng",
        resourceId: customer.name,
        previousValue: customer.email,
        newValue: "Đã xóa khỏi hệ thống",
    });
    (0, response_1.sendSuccess)(res, null, "Xóa khách hàng thành công");
});
