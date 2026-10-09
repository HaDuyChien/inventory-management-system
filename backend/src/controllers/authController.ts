import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Customer } from "../models/Customer";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/asyncHandler";
import { signToken } from "../utils/token";
import { sendSuccess } from "../utils/response";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload";

const loginSchema = z.object({
    email: z.string().email("Địa chỉ email không đúng định dạng"),
    password: z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
});

const registerAdminSchema = z.object({
    name: z.string().min(2, "Tên phải có tối thiểu 2 ký tự"),
    email: z.string().email("Địa chỉ email không đúng định dạng"),
    password: z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
    role: z.enum(["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF", "VIEWER"]).optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
});

const registerCustomerSchema = z.object({
    name: z.string().min(2, "Tên khách hàng phải có tối thiểu 2 ký tự"),
    email: z.string().email("Địa chỉ email không đúng định dạng"),
    phone: z.string().min(9, "Số điện thoại không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
    address: z.string().optional(),
});

export const loginAdmin = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const validatedData = loginSchema.parse(req.body);

        const user = await User.findOne({ email: validatedData.email }).select("+password");
        if (!user) {
            return next(new AppError("Email hoặc mật khẩu không chính xác", 401));
        }

        const isMatch = await user.comparePassword(validatedData.password);
        if (!isMatch) {
            return next(new AppError("Email hoặc mật khẩu không chính xác", 401));
        }

        if (user.status !== "ACTIVE") {
            return next(new AppError("Tài khoản đã bị vô hiệu hóa", 403));
        }

        const token = signToken({
            id: user._id.toString(),
            role: user.role,
            type: "admin",
        });

        const userData = user.toObject();
        delete userData.password;

        sendSuccess(
            res,
            {
                nguoiDung: userData,
                maXacThuc: token,
            },
            "Đăng nhập hệ thống quản trị thành công",
        );
    },
);

export const registerAdmin = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const validatedData = registerAdminSchema.parse(req.body);

        const existing = await User.findOne({ email: validatedData.email });
        if (existing) {
            return next(new AppError("Địa chỉ email đã được đăng ký trong hệ thống", 400));
        }

        const user = await User.create(validatedData);
        const token = signToken({
            id: user._id.toString(),
            role: user.role,
            type: "admin",
        });

        const userData = user.toObject();
        delete userData.password;

        sendSuccess(
            res,
            {
                nguoiDung: userData,
                maXacThuc: token,
            },
            "Tạo tài khoản quản trị thành công",
            201,
        );
    },
);

export const getMeAdmin = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        sendSuccess(res, req.user, "Lấy thông tin người dùng thành công");
    },
);

export const loginCustomer = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const validatedData = loginSchema.parse(req.body);

        const customer = await Customer.findOne({ email: validatedData.email }).select("+password");
        if (!customer) {
            return next(new AppError("Email hoặc mật khẩu không chính xác", 401));
        }

        const isMatch = await customer.comparePassword(validatedData.password);
        if (!isMatch) {
            return next(new AppError("Email hoặc mật khẩu không chính xác", 401));
        }

        if (customer.status !== "ACTIVE") {
            return next(new AppError("Tài khoản khách hàng đã bị tạm khóa", 403));
        }

        const token = signToken({
            id: customer._id.toString(),
            type: "customer",
        });

        const customerData = customer.toObject();
        delete customerData.password;

        sendSuccess(
            res,
            {
                khachHang: customerData,
                maXacThuc: token,
            },
            "Đăng nhập tài khoản khách hàng thành công",
        );
    },
);

export const registerCustomer = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const validatedData = registerCustomerSchema.parse(req.body);

        const existing = await Customer.findOne({ email: validatedData.email });
        if (existing) {
            return next(new AppError("Email này đã được sử dụng", 400));
        }

        const customer = await Customer.create(validatedData);
        const token = signToken({
            id: customer._id.toString(),
            type: "customer",
        });

        const customerData = customer.toObject();
        delete customerData.password;

        sendSuccess(
            res,
            {
                khachHang: customerData,
                maXacThuc: token,
            },
            "Đăng ký tài khoản khách hàng thành công",
            201,
        );
    },
);

export const getMeCustomer = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        sendSuccess(res, req.customer, "Lấy thông tin khách hàng thành công");
    },
);

const updateProfileSchema = z.object({
    name: z.string().min(2, "Tên phải có tối thiểu 2 ký tự").max(100, "Tên tối đa 100 ký tự").optional(),
    phone: z.string().max(20, "Số điện thoại tối đa 20 ký tự").optional(),
    department: z.string().max(100, "Phòng ban tối đa 100 ký tự").optional(),
    avatar: z.string().optional(),
    currentPassword: z.string().min(6, "Mật khẩu hiện tại tối thiểu 6 ký tự").optional(),
    newPassword: z.string().min(6, "Mật khẩu mới phải có tối thiểu 6 ký tự").optional(),
});

export const updateProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.user?._id;
        if (!userId) {
            return next(new AppError("Yêu cầu đăng nhập", 401));
        }

        const validated = updateProfileSchema.parse(req.body);
        const user = await User.findById(userId).select("+password");

        if (!user) {
            return next(new AppError("Không tìm thấy người dùng", 404));
        }

        if (validated.currentPassword || validated.newPassword) {
            if (!validated.currentPassword || !validated.newPassword) {
                return next(new AppError("Vui lòng cung cấp cả mật khẩu hiện tại và mật khẩu mới", 400));
            }
            const isMatch = await user.comparePassword(validated.currentPassword);
            if (!isMatch) {
                return next(new AppError("Mật khẩu hiện tại không chính xác", 400));
            }
            user.password = validated.newPassword;
        }

        if (validated.name !== undefined) user.name = validated.name;
        if (validated.phone !== undefined) user.phone = validated.phone;
        if (validated.department !== undefined) user.department = validated.department;
        if (validated.avatar !== undefined) user.avatar = validated.avatar;

        await user.save();

        const userData = user.toObject();
        delete userData.password;

        sendSuccess(res, userData, "Cập nhật thông tin cá nhân thành công");
    },
);

export const uploadAvatar = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.file) {
            return next(new AppError("Vui lòng chọn tệp hình ảnh để tải lên", 400));
        }

        const uploaded = await uploadBufferToCloudinary(req.file.buffer, "inventohub/avatars");
        sendSuccess(
            res,
            {
                url: uploaded.url,
                publicId: uploaded.publicId,
            },
            "Tải ảnh đại diện lên Cloudinary thành công",
        );
    },
);
