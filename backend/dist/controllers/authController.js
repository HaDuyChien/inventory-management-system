"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.updateProfile = exports.getMeCustomer = exports.registerCustomer = exports.loginCustomer = exports.getMeAdmin = exports.registerAdmin = exports.loginAdmin = void 0;
const zod_1 = require("zod");
const User_1 = require("../models/User");
const Customer_1 = require("../models/Customer");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const token_1 = require("../utils/token");
const response_1 = require("../utils/response");
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Địa chỉ email không đúng định dạng"),
    password: zod_1.z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
});
const registerAdminSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Tên phải có tối thiểu 2 ký tự"),
    email: zod_1.z.string().email("Địa chỉ email không đúng định dạng"),
    password: zod_1.z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
    role: zod_1.z.enum(["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF", "VIEWER"]).optional(),
    phone: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
});
const registerCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Tên khách hàng phải có tối thiểu 2 ký tự"),
    email: zod_1.z.string().email("Địa chỉ email không đúng định dạng"),
    phone: zod_1.z.string().min(9, "Số điện thoại không hợp lệ"),
    password: zod_1.z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
    address: zod_1.z.string().optional(),
});
exports.loginAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validatedData = loginSchema.parse(req.body);
    const user = await User_1.User.findOne({ email: validatedData.email }).select("+password");
    if (!user) {
        return next(new AppError_1.AppError("Email hoặc mật khẩu không chính xác", 401));
    }
    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
        return next(new AppError_1.AppError("Email hoặc mật khẩu không chính xác", 401));
    }
    if (user.status !== "ACTIVE") {
        return next(new AppError_1.AppError("Tài khoản đã bị vô hiệu hóa", 403));
    }
    const token = (0, token_1.signToken)({
        id: user._id.toString(),
        role: user.role,
        type: "admin",
    });
    const userData = user.toObject();
    delete userData.password;
    (0, response_1.sendSuccess)(res, {
        nguoiDung: userData,
        maXacThuc: token,
    }, "Đăng nhập hệ thống quản trị thành công");
});
exports.registerAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validatedData = registerAdminSchema.parse(req.body);
    const existing = await User_1.User.findOne({ email: validatedData.email });
    if (existing) {
        return next(new AppError_1.AppError("Địa chỉ email đã được đăng ký trong hệ thống", 400));
    }
    const user = await User_1.User.create(validatedData);
    const token = (0, token_1.signToken)({
        id: user._id.toString(),
        role: user.role,
        type: "admin",
    });
    const userData = user.toObject();
    delete userData.password;
    (0, response_1.sendSuccess)(res, {
        nguoiDung: userData,
        maXacThuc: token,
    }, "Tạo tài khoản quản trị thành công", 201);
});
exports.getMeAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res, _next) => {
    (0, response_1.sendSuccess)(res, req.user, "Lấy thông tin người dùng thành công");
});
exports.loginCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validatedData = loginSchema.parse(req.body);
    const customer = await Customer_1.Customer.findOne({ email: validatedData.email }).select("+password");
    if (!customer) {
        return next(new AppError_1.AppError("Email hoặc mật khẩu không chính xác", 401));
    }
    const isMatch = await customer.comparePassword(validatedData.password);
    if (!isMatch) {
        return next(new AppError_1.AppError("Email hoặc mật khẩu không chính xác", 401));
    }
    if (customer.status !== "ACTIVE") {
        return next(new AppError_1.AppError("Tài khoản khách hàng đã bị tạm khóa", 403));
    }
    const token = (0, token_1.signToken)({
        id: customer._id.toString(),
        type: "customer",
    });
    const customerData = customer.toObject();
    delete customerData.password;
    (0, response_1.sendSuccess)(res, {
        khachHang: customerData,
        maXacThuc: token,
    }, "Đăng nhập tài khoản khách hàng thành công");
});
exports.registerCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validatedData = registerCustomerSchema.parse(req.body);
    const existing = await Customer_1.Customer.findOne({ email: validatedData.email });
    if (existing) {
        return next(new AppError_1.AppError("Email này đã được sử dụng", 400));
    }
    const customer = await Customer_1.Customer.create(validatedData);
    const token = (0, token_1.signToken)({
        id: customer._id.toString(),
        type: "customer",
    });
    const customerData = customer.toObject();
    delete customerData.password;
    (0, response_1.sendSuccess)(res, {
        khachHang: customerData,
        maXacThuc: token,
    }, "Đăng ký tài khoản khách hàng thành công", 201);
});
exports.getMeCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res, _next) => {
    (0, response_1.sendSuccess)(res, req.customer, "Lấy thông tin khách hàng thành công");
});
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Tên phải có tối thiểu 2 ký tự").max(100, "Tên tối đa 100 ký tự").optional(),
    phone: zod_1.z.string().max(20, "Số điện thoại tối đa 20 ký tự").optional(),
    department: zod_1.z.string().max(100, "Phòng ban tối đa 100 ký tự").optional(),
    avatar: zod_1.z.string().optional(),
    currentPassword: zod_1.z.string().min(6, "Mật khẩu hiện tại tối thiểu 6 ký tự").optional(),
    newPassword: zod_1.z.string().min(6, "Mật khẩu mới phải có tối thiểu 6 ký tự").optional(),
});
exports.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?._id;
    if (!userId) {
        return next(new AppError_1.AppError("Yêu cầu đăng nhập", 401));
    }
    const validated = updateProfileSchema.parse(req.body);
    const user = await User_1.User.findById(userId).select("+password");
    if (!user) {
        return next(new AppError_1.AppError("Không tìm thấy người dùng", 404));
    }
    if (validated.currentPassword || validated.newPassword) {
        if (!validated.currentPassword || !validated.newPassword) {
            return next(new AppError_1.AppError("Vui lòng cung cấp cả mật khẩu hiện tại và mật khẩu mới", 400));
        }
        const isMatch = await user.comparePassword(validated.currentPassword);
        if (!isMatch) {
            return next(new AppError_1.AppError("Mật khẩu hiện tại không chính xác", 400));
        }
        user.password = validated.newPassword;
    }
    if (validated.name !== undefined)
        user.name = validated.name;
    if (validated.phone !== undefined)
        user.phone = validated.phone;
    if (validated.department !== undefined)
        user.department = validated.department;
    if (validated.avatar !== undefined)
        user.avatar = validated.avatar;
    await user.save();
    const userData = user.toObject();
    delete userData.password;
    (0, response_1.sendSuccess)(res, userData, "Cập nhật thông tin cá nhân thành công");
});
exports.uploadAvatar = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError_1.AppError("Vui lòng chọn tệp hình ảnh để tải lên", 400));
    }
    const uploaded = await (0, cloudinaryUpload_1.uploadBufferToCloudinary)(req.file.buffer, "inventohub/avatars");
    (0, response_1.sendSuccess)(res, {
        url: uploaded.url,
        publicId: uploaded.publicId,
    }, "Tải ảnh đại diện lên Cloudinary thành công");
});
