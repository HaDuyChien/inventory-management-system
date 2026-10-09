import { Request, Response, NextFunction } from "express";
import { Return } from "../models/Return";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Transaction } from "../models/Transaction";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getReturns = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const filter: Record<string, unknown> = {};

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

        const returns = await Return.find(filter)
            .sort({ createdAt: -1 })
            .populate("order", "orderNumber totalAmount paymentStatus")
            .populate("items.product", "name sku price costPrice thumbnail");

        sendSuccess(res, returns, "Lấy danh sách phiếu trả hàng thành công");
    },
);

export const getReturnById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const returnDoc = await Return.findById(req.params.id)
            .populate("order")
            .populate("items.product");

        if (!returnDoc) {
            return next(new AppError("Không tìm thấy phiếu trả hàng yêu cầu", 404));
        }

        sendSuccess(res, returnDoc, "Lấy chi tiết phiếu trả hàng thành công");
    },
);

export const createReturn = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const {
            orderNumber,
            customerName,
            customerPhone,
            warehouseName,
            items,
            returnReason,
            notes,
        } = req.body;

        if (!orderNumber || !items || !Array.isArray(items) || items.length === 0) {
            return next(new AppError("Vui lòng cung cấp mã đơn hàng và danh sách sản phẩm trả", 400));
        }

        const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() });

        const count = await Return.countDocuments();
        const year = new Date().getFullYear();
        const seq = String(count + 1).padStart(3, "0");
        const rmaNumber = `RMA-${year}-${seq}`;

        let calculatedRefund = 0;
        const mappedItems = items.map((it: any) => {
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

        const newReturn = await Return.create({
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
            performedBy: (req as any).user?.name || "Quản trị viên",
        });

        await AuditLog.create({
            user: (req as any).user?.name || "Quản trị viên",
            userRole: (req as any).user?.role || "ADMIN",
            action: "TAO_PHIEU_TRA_HANG",
            resource: "Trả hàng",
            resourceId: rmaNumber,
            previousValue: `Đơn gốc: ${orderNumber}`,
            newValue: `Tạo phiếu RMA hoàn tiền: ${calculatedRefund.toLocaleString("vi-VN")} đ`,
        });

        sendSuccess(res, newReturn, "Tạo phiếu trả hàng thành công", 201);
    },
);

export const updateReturnStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { status, refundStatus, inspectionNotes } = req.body;
        const returnDoc = await Return.findById(req.params.id);
        if (!returnDoc) {
            return next(new AppError("Không tìm thấy phiếu trả hàng cần cập nhật", 404));
        }

        const oldStatus = returnDoc.status;
        const oldRefund = returnDoc.refundStatus;

        if (status) returnDoc.status = status;
        if (refundStatus) returnDoc.refundStatus = refundStatus;
        if (inspectionNotes !== undefined) returnDoc.inspectionNotes = inspectionNotes;
        returnDoc.performedBy = (req as any).user?.name || returnDoc.performedBy;

        await returnDoc.save();

        if (status === "RESTOCKED" && oldStatus !== "RESTOCKED") {
            for (const item of returnDoc.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    const beforeStock = product.stock;
                    const afterStock = beforeStock + Number(item.quantity);
                    product.stock = afterStock;
                    await product.save();

                    const txCode = `TX-RET-${Date.now().toString().slice(-6)}`;
                    await Transaction.create({
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
                        performedBy: (req as any).user?.name || "Nhân viên kho",
                        reason: `Nhập lại kho từ phiếu đổi trả ${returnDoc.rmaNumber} của đơn ${returnDoc.orderNumber}`,
                    });
                }
            }

            await AuditLog.create({
                user: (req as any).user?.name || "Nhân viên kho",
                userRole: (req as any).user?.role || "ADMIN",
                action: "NHAP_LAI_KHO_TRA_HANG",
                resource: "Trả hàng",
                resourceId: returnDoc.rmaNumber,
                previousValue: `Trạng thái cũ: ${oldStatus}`,
                newValue: `Hoàn tất nhập lại tồn kho cho phiếu ${returnDoc.rmaNumber}`,
            });
        }

        sendSuccess(res, returnDoc, "Cập nhật trạng thái phiếu trả hàng thành công");
    },
);

export const deleteReturn = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const returnDoc = await Return.findById(req.params.id);
        if (!returnDoc) {
            return next(new AppError("Không tìm thấy phiếu trả hàng để xóa", 404));
        }

        if (returnDoc.status === "RESTOCKED") {
            return next(
                new AppError("Không thể xóa phiếu trả hàng đã hoàn tất nhập lại kho", 400),
            );
        }

        await Return.findByIdAndDelete(req.params.id);

        await AuditLog.create({
            user: (req as any).user?.name || "Quản trị viên",
            userRole: (req as any).user?.role || "ADMIN",
            action: "XOA_PHIEU_TRA_HANG",
            resource: "Trả hàng",
            resourceId: returnDoc.rmaNumber,
            previousValue: returnDoc.status,
            newValue: "Đã xóa khỏi hệ thống",
        });

        sendSuccess(res, null, "Xóa phiếu trả hàng thành công");
    },
);
