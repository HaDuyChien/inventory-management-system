"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.resetUserPassword = exports.toggleUserStatus = exports.updateUserRole = exports.updateUser = exports.createUser = exports.getUserById = exports.getUserStats = exports.getUsers = void 0;
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
exports.getUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { search, role, status } = req.query;
    const filter = {};
    if (role && typeof role === "string" && role !== "ALL") {
        filter.role = role;
    }
    if (status && typeof status === "string" && status !== "ALL") {
        filter.status = status;
    }
    if (search && typeof search === "string" && search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [
            { name: regex },
            { email: regex },
            { phone: regex },
            { department: regex },
        ];
    }
    const users = await User_1.User.find(filter).select("-password").sort({ createdAt: -1 });
    (0, response_1.sendSuccess)(res, users, "Lấy danh sách người dùng thành công");
});
exports.getUserStats = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const totalUsers = await User_1.User.countDocuments();
    const adminCount = await User_1.User.countDocuments({ role: "ADMIN" });
    const managerCount = await User_1.User.countDocuments({ role: "WAREHOUSE_MANAGER" });
    const staffCount = await User_1.User.countDocuments({ role: "WAREHOUSE_STAFF" });
    const viewerCount = await User_1.User.countDocuments({ role: "VIEWER" });
    const activeCount = await User_1.User.countDocuments({ status: "ACTIVE" });
    const inactiveCount = await User_1.User.countDocuments({ status: "INACTIVE" });
    (0, response_1.sendSuccess)(res, {
        totalUsers,
        adminCount,
        managerCount,
        staffCount,
        viewerCount,
        activeCount,
        inactiveCount,
    }, "Lấy thống kê nhân sự thành công");
});
exports.getUserById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const user = await User_1.User.findById(id).select("-password");
    if (!user) {
        return next(new AppError_1.AppError("Không tìm thấy thông tin người dùng", 404));
    }
    (0, response_1.sendSuccess)(res, user, "Lấy thông tin người dùng thành công");
});
exports.createUser = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { name, email, password, role, status, phone, department, avatar } = req.body;
    if (!name || !email || !password) {
        return next(new AppError_1.AppError("Vui lòng điền đầy đủ họ tên, email và mật khẩu", 400));
    }
    if (typeof password !== "string" || password.length < 6) {
        return next(new AppError_1.AppError("Mật khẩu khởi tạo phải có tối thiểu 6 ký tự", 400));
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User_1.User.findOne({ email: normalizedEmail });
    if (existing) {
        return next(new AppError_1.AppError("Địa chỉ email này đã được sử dụng trên hệ thống", 400));
    }
    const newUser = await User_1.User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: role || "WAREHOUSE_STAFF",
        status: status || "ACTIVE",
        phone: phone ? phone.trim() : "",
        department: department ? department.trim() : "Kho vận",
        avatar: avatar || "",
    });
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "TẠO_NGƯỜI_DÙNG",
        resource: "Người dùng",
        resourceId: newUser.email,
        previousValue: "Chưa có tài khoản",
        newValue: `Tạo tài khoản ${newUser.name} với vai trò ${newUser.role}`,
    });
    const createdData = await User_1.User.findById(newUser._id).select("-password");
    (0, response_1.sendSuccess)(res, createdData, "Tạo tài khoản nhân viên thành công", 201);
});
exports.updateUser = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { name, phone, department, avatar, role, status } = req.body;
    const targetUser = await User_1.User.findById(id);
    if (!targetUser) {
        return next(new AppError_1.AppError("Không tìm thấy tài khoản cần cập nhật", 404));
    }
    const currentUserId = req.user?._id?.toString();
    if (status === "INACTIVE" && targetUser.status === "ACTIVE") {
        if (currentUserId === targetUser._id.toString()) {
            return next(new AppError_1.AppError("Bạn không thể tự khóa tài khoản của chính mình", 400));
        }
        if (targetUser.role === "ADMIN") {
            const adminCount = await User_1.User.countDocuments({ role: "ADMIN", status: "ACTIVE" });
            if (adminCount <= 1) {
                return next(new AppError_1.AppError("Không thể khóa tài khoản Quản trị viên duy nhất còn hoạt động", 400));
            }
        }
    }
    if (role && role !== targetUser.role && targetUser.role === "ADMIN") {
        const adminCount = await User_1.User.countDocuments({ role: "ADMIN", status: "ACTIVE" });
        if (adminCount <= 1) {
            return next(new AppError_1.AppError("Không thể giáng chức Quản trị viên duy nhất còn lại của hệ thống", 400));
        }
    }
    const oldSnapshot = `${targetUser.name} - ${targetUser.role} - ${targetUser.status}`;
    if (name)
        targetUser.name = name.trim();
    if (phone !== undefined)
        targetUser.phone = phone ? phone.trim() : "";
    if (department !== undefined)
        targetUser.department = department ? department.trim() : "";
    if (avatar !== undefined)
        targetUser.avatar = avatar;
    if (role)
        targetUser.role = role;
    if (status)
        targetUser.status = status;
    await targetUser.save();
    const newSnapshot = `${targetUser.name} - ${targetUser.role} - ${targetUser.status}`;
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "CẬP_NHẬT_NGƯỜI_DÙNG",
        resource: "Người dùng",
        resourceId: targetUser.email,
        previousValue: oldSnapshot,
        newValue: newSnapshot,
    });
    const updatedData = await User_1.User.findById(targetUser._id).select("-password");
    (0, response_1.sendSuccess)(res, updatedData, "Cập nhật thông tin tài khoản thành công");
});
exports.updateUserRole = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF", "VIEWER"];
    if (!role || !allowedRoles.includes(role)) {
        return next(new AppError_1.AppError("Vai trò phân quyền không hợp lệ", 400));
    }
    const targetUser = await User_1.User.findById(id);
    if (!targetUser) {
        return next(new AppError_1.AppError("Không tìm thấy tài khoản người dùng", 404));
    }
    if (targetUser.role === "ADMIN" && role !== "ADMIN") {
        const activeAdminCount = await User_1.User.countDocuments({
            role: "ADMIN",
            status: "ACTIVE",
        });
        if (activeAdminCount <= 1) {
            return next(new AppError_1.AppError("Không thể chuyển vai trò của Quản trị viên duy nhất", 400));
        }
    }
    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "PHÂN_QUYỀN_NGƯỜI_DÙNG",
        resource: "Người dùng",
        resourceId: targetUser.email,
        previousValue: oldRole,
        newValue: role,
    });
    const updatedData = await User_1.User.findById(targetUser._id).select("-password");
    (0, response_1.sendSuccess)(res, updatedData, "Cập nhật vai trò tài khoản thành công");
});
exports.toggleUserStatus = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const targetUser = await User_1.User.findById(id);
    if (!targetUser) {
        return next(new AppError_1.AppError("Không tìm thấy người dùng", 404));
    }
    const currentUserId = req.user?._id?.toString();
    if (targetUser.status === "ACTIVE") {
        if (currentUserId === targetUser._id.toString()) {
            return next(new AppError_1.AppError("Bạn không thể tự khóa tài khoản của chính mình", 400));
        }
        if (targetUser.role === "ADMIN") {
            const activeAdminCount = await User_1.User.countDocuments({
                role: "ADMIN",
                status: "ACTIVE",
            });
            if (activeAdminCount <= 1) {
                return next(new AppError_1.AppError("Không thể khóa tài khoản Quản trị viên duy nhất còn hoạt động", 400));
            }
        }
        targetUser.status = "INACTIVE";
    }
    else {
        targetUser.status = "ACTIVE";
    }
    await targetUser.save();
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "THAY_ĐỔI_TRẠNG_THÁI_NGƯỜI_DÙNG",
        resource: "Người dùng",
        resourceId: targetUser.email,
        previousValue: targetUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        newValue: targetUser.status,
    });
    const updatedData = await User_1.User.findById(targetUser._id).select("-password");
    (0, response_1.sendSuccess)(res, updatedData, targetUser.status === "ACTIVE"
        ? "Đã kích hoạt mở khóa tài khoản"
        : "Đã tạm dừng khóa tài khoản người dùng");
});
exports.resetUserPassword = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return next(new AppError_1.AppError("Mật khẩu mới phải có tối thiểu 6 ký tự", 400));
    }
    const targetUser = await User_1.User.findById(id);
    if (!targetUser) {
        return next(new AppError_1.AppError("Không tìm thấy tài khoản người dùng", 404));
    }
    targetUser.password = newPassword;
    await targetUser.save();
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "ĐẶT_LẠI_MẬT_KHẨU",
        resource: "Người dùng",
        resourceId: targetUser.email,
        previousValue: "Mật khẩu cũ",
        newValue: "Mật khẩu mới đã được cập nhật thành công",
    });
    (0, response_1.sendSuccess)(res, null, "Đặt lại mật khẩu cho tài khoản người dùng thành công");
});
exports.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const targetUser = await User_1.User.findById(id);
    if (!targetUser) {
        return next(new AppError_1.AppError("Không tìm thấy tài khoản cần xóa", 404));
    }
    const currentUserId = req.user?._id?.toString();
    if (currentUserId === targetUser._id.toString()) {
        return next(new AppError_1.AppError("Bạn không thể tự xóa tài khoản của chính mình", 400));
    }
    if (targetUser.role === "ADMIN") {
        const adminCount = await User_1.User.countDocuments({ role: "ADMIN" });
        if (adminCount <= 1) {
            return next(new AppError_1.AppError("Không thể xóa tài khoản Quản trị viên duy nhất trong hệ thống", 400));
        }
    }
    const deletedEmail = targetUser.email;
    const deletedName = targetUser.name;
    await User_1.User.findByIdAndDelete(id);
    await AuditLog_1.AuditLog.create({
        user: req.user?.name || "Quản trị viên",
        userRole: req.user?.role || "ADMIN",
        action: "XÓA_NGƯỜI_DÙNG",
        resource: "Người dùng",
        resourceId: deletedEmail,
        previousValue: `${deletedName} - ${deletedEmail}`,
        newValue: "Đã xóa khỏi hệ thống",
    });
    (0, response_1.sendSuccess)(res, null, "Xóa tài khoản người dùng thành công");
});
