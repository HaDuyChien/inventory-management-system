import { Request, Response, NextFunction } from "express";
import { Supplier } from "../models/Supplier";
import { Order } from "../models/Order";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getSuppliers = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
        const suppliers = await Supplier.find().sort({ createdAt: -1 });
        const orders = await Order.find({ type: "PURCHASE" });

        const enriched = suppliers.map((s) => {
            const supOrders = orders.filter(
                (o) =>
                    (o.supplier && o.supplier.toString() === s._id.toString()) ||
                    o.supplierName === s.name,
            );
            const activeOrders = supOrders.filter(
                (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
            ).length;
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

        sendSuccess(res, enriched, "Lấy danh sách nhà cung cấp thành công");
    },
);

export const getSupplierStats = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
        const suppliers = await Supplier.find();
        const orders = await Order.find({ type: "PURCHASE" });

        const totalSuppliers = suppliers.length;
        const activeSuppliers = suppliers.filter((s) => s.status === "ACTIVE").length;

        const totalSpend = orders
            .filter((o) => o.status !== "CANCELLED")
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        const totalUnpaidDebt = orders
            .filter((o) => o.status !== "CANCELLED" && o.paymentStatus === "PENDING")
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        const activeOrdersCount = orders.filter(
            (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "SHIPPING",
        ).length;

        sendSuccess(
            res,
            {
                totalSuppliers,
                activeSuppliers,
                totalSpend,
                totalUnpaidDebt,
                activeOrdersCount,
            },
            "Lấy số liệu thống kê nhà cung cấp thành công",
        );
    },
);

export const getSupplierById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return next(new AppError("Không tìm thấy nhà cung cấp", 404));
        }

        const orders = await Order.find({
            type: "PURCHASE",
            $or: [{ supplier: supplier._id }, { supplierName: supplier.name }],
        });

        const activeOrders = orders.filter(
            (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
        ).length;
        const totalSpend = orders
            .filter((o) => o.status !== "CANCELLED")
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        const unpaidDebt = orders
            .filter((o) => o.status !== "CANCELLED" && o.paymentStatus === "PENDING")
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

        sendSuccess(
            res,
            {
                ...supplier.toObject(),
                activeOrders,
                totalSpend,
                unpaidDebt,
            },
            "Lấy thông tin nhà cung cấp thành công",
        );
    },
);

export const getSupplierOrders = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return next(new AppError("Không tìm thấy nhà cung cấp", 404));
        }

        const orders = await Order.find({
            type: "PURCHASE",
            $or: [{ supplier: supplier._id }, { supplierName: supplier.name }],
        }).sort({ createdAt: -1 });

        sendSuccess(res, orders, "Lấy danh sách đơn mua hàng của nhà cung cấp thành công");
    },
);

export const paySupplierOrder = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { orderId } = req.params;
        const order = await Order.findOne({
            _id: orderId,
            type: "PURCHASE",
        });

        if (!order) {
            return next(new AppError("Không tìm thấy đơn mua hàng cần thanh toán", 404));
        }

        order.paymentStatus = "PAID";
        await order.save();

        await AuditLog.create({
            user: req.user?.name || "Quản trị viên",
            userRole: req.user?.role || "ADMIN",
            action: "THANH_TOÁN_CÔNG_NỢ_NCC",
            resource: "Đơn mua hàng",
            resourceId: order.orderNumber,
            previousValue: "Chưa thanh toán",
            newValue: `Đã thanh toán toàn bộ công nợ trị giá ${order.totalAmount} đồng`,
        });

        sendSuccess(res, order, "Thanh toán công nợ đơn hàng thành công");
    },
);

export const createSupplier = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const existing = await Supplier.findOne({
            $or: [{ name: req.body.name }, { code: req.body.code?.toUpperCase() }],
        });
        if (existing) {
            return next(new AppError("Tên hoặc mã nhà cung cấp đã tồn tại trong hệ thống", 400));
        }

        const supplier = await Supplier.create({
            ...req.body,
            code: req.body.code?.toUpperCase(),
        });

        await AuditLog.create({
            user: req.user?.name || "Quản trị viên",
            userRole: req.user?.role || "ADMIN",
            action: "TẠO_NHÀ_CUNG_CẤP",
            resource: "Nhà cung cấp",
            resourceId: `${supplier.name} - ${supplier.code}`,
            previousValue: "Khởi tạo mới",
            newValue: `Email ${supplier.email}, SĐT ${supplier.phone}`,
        });

        sendSuccess(res, supplier, "Thêm mới nhà cung cấp thành công", 201);
    },
);

export const updateSupplier = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!supplier) {
            return next(new AppError("Không tìm thấy nhà cung cấp để cập nhật", 404));
        }

        await AuditLog.create({
            user: req.user?.name || "Quản trị viên",
            userRole: req.user?.role || "ADMIN",
            action: "CẬP_NHẬT_NHÀ_CUNG_CẤP",
            resource: "Nhà cung cấp",
            resourceId: `${supplier.name} - ${supplier.code}`,
            previousValue: "Cập nhật thông tin",
            newValue: `Cập nhật dữ liệu nhà cung cấp ${supplier.name}`,
        });

        sendSuccess(res, supplier, "Cập nhật thông tin nhà cung cấp thành công");
    },
);

export const deleteSupplier = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return next(new AppError("Không tìm thấy nhà cung cấp để xóa", 404));
        }

        await AuditLog.create({
            user: req.user?.name || "Quản trị viên",
            userRole: req.user?.role || "ADMIN",
            action: "XÓA_NHÀ_CUNG_CẤP",
            resource: "Nhà cung cấp",
            resourceId: `${supplier.name} - ${supplier.code}`,
            previousValue: "Tồn tại",
            newValue: "Đã xóa khỏi hệ thống",
        });

        sendSuccess(res, null, "Xóa nhà cung cấp thành công");
    },
);
