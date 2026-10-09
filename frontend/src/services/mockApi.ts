import type {
    Product,
    Warehouse,
    InventoryTransaction,
    PurchaseOrder,
    SalesOrder,
    Supplier,
    User,
    UserRole,
    UserStats,
    AuditLog,
    Customer,
    StockItem,
    ProductDemandForecast,
    OrderLineItem,
    ReturnOrder,
    ReturnItem,
} from "@/types";
import {
    productApi,
    categoryApi,
    warehouseApi,
    supplierApi,
    orderApi,
    transactionApi,
    auditLogApi,
    reportApi,
    aiApi,
    userApi,
    authApi,
    paymentApi,
    customerApi,
    returnApi,
    BackendProduct,
    BackendWarehouse,
    BackendSupplier,
    BackendOrder,
    BackendTransaction,
    BackendAuditLog,
    BackendUser,
    BackendCustomer,
    BackendReturn,
} from "@/services/api";

const mapBackendToFrontendCustomer = (bc: any): Customer => ({
    id: bc._id,
    name: bc.name,
    email: bc.email,
    phone: bc.phone || "",
    address: bc.address || "",
    segment: (bc.segment as "VIP" | "REGULAR" | "NEW") || "NEW",
    totalOrders: bc.totalOrders || 0,
    totalSpent: bc.totalSpent || 0,
    status: bc.status === "BLOCKED" ? "INACTIVE" : "ACTIVE",
    lastOrderDate: bc.lastOrderDate || bc.createdAt || new Date().toISOString(),
});

const mapBackendToFrontendReturn = (br: any): ReturnOrder => {
    const statusMap: Record<string, ReturnOrder["status"]> = {
        PENDING: "Pending",
        INSPECTED: "Inspected",
        RESTOCKED: "Restocked",
        REJECTED: "Rejected",
    };
    const refundMap: Record<string, ReturnOrder["refundStatus"]> = {
        PENDING: "Pending",
        REFUNDED: "Refunded",
        NO_REFUND: "NoRefund",
    };
    return {
        id: br._id,
        rmaNumber: br.rmaNumber,
        orderId: br.order?._id || br.order || "",
        orderNumber: br.orderNumber,
        customerId: br.customer?._id || br.customer || "",
        customerName: br.customerName,
        customerPhone: br.customerPhone || "",
        warehouseId: br.warehouse?._id || br.warehouse || "",
        warehouseName: br.warehouseName || "Kho Tổng Hà Nội",
        items: (br.items || []).map((it: any) => ({
            productId: it.product?._id || it.product || "",
            productName: it.name,
            sku: it.sku,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            refundAmount: it.refundAmount || it.quantity * it.unitPrice,
            reason: it.reason || "",
        })),
        returnReason: br.returnReason,
        status: statusMap[br.status] || "Pending",
        refundStatus: refundMap[br.refundStatus] || "Pending",
        totalRefundAmount: br.totalRefundAmount || 0,
        inspectionNotes: br.inspectionNotes || "",
        performedBy: br.performedBy || "Nhân viên kho",
        createdAt: br.createdAt || new Date().toISOString(),
        updatedAt: br.updatedAt || new Date().toISOString(),
    };
};

const mapBackendToFrontendUser = (bu: BackendUser): User => ({
    id: bu._id,
    name: bu.name,
    email: bu.email,
    role: bu.role,
    status: (bu.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    avatar: bu.avatar || "",
    phone: bu.phone || "",
    department: bu.department || "Kho vận",
    createdAt: bu.createdAt,
    updatedAt: bu.updatedAt,
});

const mapBackendToFrontendProduct = (bp: BackendProduct): Product => ({
    id: bp._id,
    sku: bp.sku,
    name: bp.name,
    description: bp.description || "",
    category:
        typeof bp.category === "object" && bp.category
            ? bp.category.name
            : String(bp.category || "Điện tử gia dụng"),
    brand: "InventoHub",
    costPrice: bp.costPrice || 0,
    sellingPrice: bp.price || 0,
    stock: bp.stock || 0,
    reservedStock: 0,
    availableStock: bp.stock || 0,
    minStock: bp.minStock || 5,
    warehouseId: "wh-1",
    warehouseName: "Kho Tổng Hà Nội",
    location: "Khu A - Kệ 01",
    warranty: "12 tháng",
    status: (bp.status as any) || "ACTIVE",
    image:
        bp.thumbnail ||
        (bp.images && bp.images[0]) ||
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    barcode: bp.barcode || bp.sku,
    createdAt: bp.createdAt || new Date().toISOString(),
    updatedAt: bp.createdAt || new Date().toISOString(),
});

const mapBackendToFrontendWarehouse = (bw: BackendWarehouse): Warehouse => {
    let totalBinsCount = 0;
    let totalOccupied = 0;
    let totalRacksCount = 0;

    const mappedZones = (bw.zones || []).map((z: any, idx: number) => {
        totalRacksCount += (z.racks || []).length;
        return {
            id: z._id || `zone-${idx}`,
            name: z.zoneName || `Khu ${z.code || idx + 1}`,
            code: z.code || `Z-0${idx + 1}`,
            racks: (z.racks || []).map((r: any, rIdx: number) => {
                totalBinsCount += (r.bins || []).length;
                return {
                    id: r._id || `rack-${rIdx}`,
                    name: r.name || `Kệ ${r.rackCode || `R-0${rIdx + 1}`}`,
                    bins: (r.bins || []).map((b: any, bIdx: number) => {
                        totalOccupied += b.currentOccupancy || 0;
                        return {
                            id: b._id || `bin-${b.binCode || bIdx}`,
                            name: b.name || `Ô ${b.binCode || `B-0${bIdx + 1}`}`,
                            binCode: b.binCode,
                            capacity: b.capacity || 100,
                            occupancy: b.currentOccupancy || 0,
                            status: b.status || (b.currentOccupancy > 0 ? "OCCUPIED" : "AVAILABLE"),
                            product: b.product,
                            productName: b.productName || "",
                            sku: b.sku || "",
                        };
                    }),
                };
            }),
        };
    });

    return {
        id: bw._id,
        code: bw.code,
        name: bw.name,
        address: bw.address,
        city: "Việt Nam",
        manager: bw.managerName || "Trần Hải Đăng",
        totalCapacity: bw.capacity || 5000,
        occupiedCapacity: totalOccupied,
        zonesCount: mappedZones.length,
        racksCount: totalRacksCount,
        binsCount: totalBinsCount,
        zones: mappedZones,
        createdAt: bw.createdAt || new Date().toISOString(),
    };
};

const mapBackendToFrontendSupplier = (bs: BackendSupplier): Supplier => ({
    id: bs._id,
    code: bs.code,
    name: bs.name,
    contactPerson: bs.contactPerson || "Đại diện kinh doanh",
    email: bs.email,
    phone: bs.phone,
    address: bs.address,
    taxId: bs.taxId || "",
    category: bs.category || "Điện tử",
    leadTimeDays: bs.leadTimeDays || 7,
    rating: bs.rating || 5,
    activeOrders: bs.activeOrders !== undefined ? bs.activeOrders : 0,
    totalSpend: bs.totalSpend !== undefined ? bs.totalSpend : 0,
    unpaidDebt: bs.unpaidDebt !== undefined ? bs.unpaidDebt : 0,
    status: bs.status || "ACTIVE",
});

const mapBackendToFrontendOrder = (bo: BackendOrder, type: "PURCHASE" | "SALES"): any => {
    const items: OrderLineItem[] = (bo.items || []).map((it, idx) => ({
        id: `item-${idx}`,
        productId: it.product?._id || it.product || "",
        productName: it.name || "Sản phẩm",
        sku: it.sku || "SKU-001",
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        totalPrice: it.totalPrice || (it.quantity || 1) * (it.unitPrice || 0),
    }));

    if (type === "PURCHASE") {
        const statusMap: Record<string, PurchaseOrder["status"]> = {
            DRAFT: "Draft",
            PENDING: "Pending",
            CONFIRMED: "Approved",
            SHIPPING: "Receiving",
            COMPLETED: "Completed",
            CANCELLED: "Cancelled",
        };
        const po: PurchaseOrder = {
            id: bo._id,
            orderNumber: bo.orderNumber,
            supplierId: bo.supplier?._id || bo.supplier || "",
            supplierName: bo.supplierName || bo.supplier?.name || "Nhà cung cấp",
            warehouseId: bo.warehouse?._id || bo.warehouse || "",
            warehouseName: bo.warehouseName || bo.warehouse?.name || "Kho hàng",
            status: statusMap[bo.status] || "Pending",
            orderDate: bo.createdAt || new Date().toISOString(),
            expectedDelivery: new Date().toISOString(),
            items,
            subtotal: Math.round(bo.totalAmount / 1.1),
            tax: Math.round(bo.totalAmount - bo.totalAmount / 1.1),
            totalAmount: bo.totalAmount,
            notes: bo.notes || "",
            createdByUser: "Quản trị viên",
        };
        return po;
    }

    const soStatusMap: Record<string, SalesOrder["status"]> = {
        DRAFT: "Draft",
        PENDING: "Pending",
        CONFIRMED: "Processing",
        SHIPPING: "Shipped",
        COMPLETED: "Delivered",
        CANCELLED: "Cancelled",
    };

    const so: SalesOrder = {
        id: bo._id,
        orderNumber: bo.orderNumber,
        customerName: bo.customerName || bo.customer?.name || "Khách hàng",
        customerEmail: bo.customer?.email || "khach@gmail.com",
        customerPhone: bo.customerPhone || bo.customer?.phone || "",
        warehouseId: bo.warehouse?._id || bo.warehouse || "wh-1",
        warehouseName: bo.warehouseName || "Kho Tổng Hà Nội",
        status: soStatusMap[bo.status] || "Pending",
        paymentStatus: bo.paymentStatus || "PENDING",
        paymentMethod: bo.paymentMethod || "COD",
        vnpTransactionNo: bo.vnpTransactionNo || "",
        vnpBankCode: bo.vnpBankCode || "",
        vnpPayDate: bo.vnpPayDate || "",
        orderDate: bo.createdAt || new Date().toISOString(),
        items,
        subtotal: bo.totalAmount,
        tax: 0,
        totalAmount: bo.totalAmount,
        shippingAddress: bo.shippingAddress || "Hà Nội",
        notes: bo.notes || "",
    };
    return so;
};

const mapBackendToFrontendTransaction = (bt: BackendTransaction): InventoryTransaction => ({
    id: bt._id,
    date: bt.createdAt || new Date().toISOString(),
    productId: bt.product?._id || bt.product || "prod-1",
    productName: bt.productName,
    sku: bt.sku,
    type: bt.type as any,
    quantity: bt.quantity,
    before: bt.beforeStock,
    after: bt.afterStock,
    user: bt.performedBy || "Quản trị viên",
    reference: bt.referenceCode || bt.transactionCode,
    notes: bt.reason || "",
});

const mapBackendToFrontendAuditLog = (ba: BackendAuditLog): AuditLog => ({
    id: ba._id,
    timestamp: ba.createdAt || new Date().toISOString(),
    user: ba.user,
    userRole: ba.userRole || "ADMIN",
    action: ba.action,
    resource: ba.resource,
    resourceId: ba.resourceId || "",
    previousValue: ba.previousValue || "",
    newValue: ba.newValue || "",
    ipAddress: "127.0.0.1",
});

export const mockApi = {
    getProducts: async (): Promise<Product[]> => {
        const res = await productApi.getAll({ limit: 100 });
        return (res.danhSach || []).map(mapBackendToFrontendProduct);
    },

    getProductById: async (id: string): Promise<Product | undefined> => {
        const bp = await productApi.getById(id);
        return bp ? mapBackendToFrontendProduct(bp) : undefined;
    },

    createProduct: async (
        product: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">> & Record<string, any>,
    ): Promise<Product> => {
        let categoryId: string = "";
        try {
            const categories = await categoryApi.getAll();
            const matchedCat = categories.find(
                (c) =>
                    c.name.trim().toLowerCase() === String(product.category || "").trim().toLowerCase() ||
                    c._id === product.category,
            );
            if (matchedCat) {
                categoryId = matchedCat._id;
            } else if (categories.length > 0) {
                categoryId = categories[0]._id;
            } else {
                const safeSlug =
                    String(product.category || "dien tu")
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "") || "danh-muc-moi";
                const createdCat = await categoryApi.create({
                    name: product.category || "Điện tử gia dụng",
                    slug: `${safeSlug}-${Date.now().toString().slice(-4)}`,
                    description: "Danh mục sản phẩm",
                    status: "ACTIVE",
                });
                categoryId = createdCat._id;
            }
        } catch (e) {
            categoryId = String(product.category || "");
        }

        const created = await productApi.create({
            sku: product.sku || `SKU-${Date.now().toString().slice(-6)}`,
            name: product.name || "Sản phẩm mới",
            category: categoryId,
            price: Number(product.sellingPrice) || 0,
            costPrice: Number(product.costPrice) || 0,
            stock: Number(product.stock) || 0,
            minStock: Number(product.minStock) || 5,
            unit: "Chiếc",
            thumbnail: product.image || "",
            images: product.image ? [product.image] : [],
            description: product.description || "",
            status: product.status || "ACTIVE",
            barcode: product.barcode || "",
        });

        try {
            await auditLogApi.create({
                user: "Quản trị viên",
                userRole: "ADMIN",
                action: "TẠO_SẢN_PHẨM",
                resource: "Sản phẩm",
                resourceId: `${created.name} - ${created.sku}`,
                previousValue: "Chưa có",
                newValue: `Tạo mới với số lượng ban đầu ${created.stock}`,
            });
        } catch (auditErr) {
            console.warn("Lỗi ghi nhật ký", auditErr);
        }

        return mapBackendToFrontendProduct(created);
    },

    updateProduct: async (
        id: string,
        updates: Partial<Product> & Record<string, any>,
    ): Promise<Product> => {
        let categoryId: string | undefined = undefined;
        if (updates.category) {
            try {
                const categories = await categoryApi.getAll();
                const matchedCat = categories.find(
                    (c) =>
                        c.name.trim().toLowerCase() === String(updates.category || "").trim().toLowerCase() ||
                        c._id === updates.category,
                );
                if (matchedCat) {
                    categoryId = matchedCat._id;
                }
            } catch (e) {
                console.warn("Lỗi tìm danh mục cập nhật", e);
            }
        }

        const payload: Partial<BackendProduct> = {
            name: updates.name,
            sku: updates.sku,
            price: updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : undefined,
            costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : undefined,
            stock: updates.stock !== undefined ? Number(updates.stock) : undefined,
            minStock: updates.minStock !== undefined ? Number(updates.minStock) : undefined,
            thumbnail: updates.image,
            description: updates.description,
            status: updates.status,
            barcode: updates.barcode,
        };
        if (categoryId) {
            payload.category = categoryId;
        }

        const updated = await productApi.update(id, payload);

        try {
            await auditLogApi.create({
                user: "Quản trị viên",
                userRole: "ADMIN",
                action: "CẬP_NHẬT_SẢN_PHẨM",
                resource: "Sản phẩm",
                resourceId: `${updated.name} - ${updated.sku}`,
                previousValue: "Đã sửa",
                newValue: JSON.stringify(updates),
            });
        } catch (auditErr) {
            console.warn("Lỗi ghi nhật ký", auditErr);
        }

        return mapBackendToFrontendProduct(updated);
    },

    deleteProduct: async (id: string): Promise<void> => {
        await productApi.delete(id);
    },

    uploadProductImage: async (file: File): Promise<{ url: string; publicId: string }> => {
        return await productApi.uploadImage(file);
    },

    getCategories: async () => {
        return await categoryApi.getAll();
    },

    createCategory: async (data: any) => {
        return await categoryApi.create(data);
    },

    updateCategory: async (id: string, data: any) => {
        return await categoryApi.update(id, data);
    },

    deleteCategory: async (id: string) => {
        return await categoryApi.delete(id);
    },

    askAI: async (question: string, contextSummary?: string): Promise<string> => {
        const res = await aiApi.askAssistant(question, contextSummary);
        return res.reply;
    },

    askAssistant: async (question: string, contextSummary?: string) => {
        return await aiApi.askAssistant(question, contextSummary);
    },

    getWarehouseSnapshot: async () => {
        return await aiApi.getWarehouseSnapshot();
    },

    getReorderAdvice: async () => {
        return await aiApi.getReorderAdvice();
    },

    generateAIDescription: async (data: { name: string; category?: string; brand?: string }) => {
        return await aiApi.generateDescription(data);
    },

    getChatSessions: async () => {
        return await aiApi.getSessions();
    },

    getChatSessionById: async (id: string) => {
        return await aiApi.getSessionById(id);
    },

    createChatSession: async (title?: string) => {
        return await aiApi.createSession(title);
    },

    sendMessageToChatSession: async (sessionId: string, question: string, contextSummary?: string) => {
        return await aiApi.sendMessage(sessionId, question, contextSummary);
    },

    deleteChatSession: async (id: string) => {
        return await aiApi.deleteSession(id);
    },

    renameChatSession: async (id: string, title: string) => {
        return await aiApi.renameSession(id, title);
    },

    updateUserProfile: async (data: {
        name?: string;
        phone?: string;
        department?: string;
        avatar?: string;
        currentPassword?: string;
        newPassword?: string;
    }) => {
        return await authApi.updateProfile(data);
    },

    uploadAvatar: async (file: File) => {
        return await authApi.uploadAvatar(file);
    },

    adjustStock: async (
        productId: string,
        adjustmentQty: number,
        type: "ADJUSTMENT" | "DAMAGE" | "INBOUND" | "OUTBOUND",
        reason: string,
    ): Promise<Product> => {
        await transactionApi.create({
            type,
            productId,
            quantity: adjustmentQty,
            warehouseName: "Kho Tổng Hà Nội",
            reason,
            performedBy: "Quản trị viên",
            referenceCode: `ADJ-${Date.now().toString().slice(-4)}`,
        });

        const bp = await productApi.getById(productId);
        return mapBackendToFrontendProduct(bp);
    },

    getWarehouses: async (): Promise<Warehouse[]> => {
        const list = await warehouseApi.getAll();
        return list.map(mapBackendToFrontendWarehouse);
    },

    getWarehouseById: async (id: string): Promise<Warehouse | undefined> => {
        const bw = await warehouseApi.getById(id);
        return bw ? mapBackendToFrontendWarehouse(bw) : undefined;
    },

    createWarehouse: async (
        warehouse: Omit<Warehouse, "id" | "createdAt">,
    ): Promise<Warehouse> => {
        const created = await warehouseApi.create({
            name: warehouse.name,
            code: warehouse.code,
            address: warehouse.address,
            capacity: warehouse.totalCapacity || 5000,
            managerName: warehouse.manager,
            status: "ACTIVE",
            zones: warehouse.zones as any,
        });
        return mapBackendToFrontendWarehouse(created);
    },

    relocateStock: async (data: {
        sourceWarehouseId: string;
        sourceBinCode: string;
        targetWarehouseId: string;
        targetBinCode: string;
        quantity: number;
        reason?: string;
        performedBy?: string;
    }): Promise<any> => {
        return await warehouseApi.relocateStock(data);
    },

    addWarehouseZone: async (warehouseId: string, zoneData: { zoneName: string; code?: string }): Promise<Warehouse> => {
        const updated = await warehouseApi.addZone(warehouseId, zoneData);
        return mapBackendToFrontendWarehouse(updated);
    },

    addWarehouseRack: async (warehouseId: string, data: { zoneCode: string; rackCode: string; name?: string }): Promise<Warehouse> => {
        const updated = await warehouseApi.addRack(warehouseId, data);
        return mapBackendToFrontendWarehouse(updated);
    },

    addWarehouseBin: async (warehouseId: string, data: {
        zoneCode: string;
        rackCode: string;
        binCode: string;
        name?: string;
        capacity?: number;
        sku?: string;
        productName?: string;
        currentOccupancy?: number;
    }): Promise<Warehouse> => {
        const updated = await warehouseApi.addBin(warehouseId, data);
        return mapBackendToFrontendWarehouse(updated);
    },

    updateWarehouseBin: async (warehouseId: string, data: {
        binId: string;
        status?: "AVAILABLE" | "OCCUPIED" | "FULL" | "MAINTENANCE";
        capacity?: number;
        currentOccupancy?: number;
        sku?: string;
        productName?: string;
    }): Promise<Warehouse> => {
        const updated = await warehouseApi.updateBin(warehouseId, data);
        return mapBackendToFrontendWarehouse(updated);
    },

    getTransactions: async (param?: unknown): Promise<InventoryTransaction[]> => {
        const productId = typeof param === "string" ? param : undefined;
        const list = await transactionApi.getAll({ productId });
        return list.map(mapBackendToFrontendTransaction);
    },

    getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
        const list = await orderApi.getAll({ type: "PURCHASE" });
        return list.map((bo) => mapBackendToFrontendOrder(bo, "PURCHASE"));
    },

    getSalesOrders: async (): Promise<SalesOrder[]> => {
        const list = await orderApi.getAll({ type: "SALES" });
        return list.map((bo) => mapBackendToFrontendOrder(bo, "SALES"));
    },

    createPurchaseOrder: async (
        po: Omit<PurchaseOrder, "id" | "orderNumber">,
    ): Promise<PurchaseOrder> => {
        const created = await orderApi.create({
            type: "PURCHASE",
            supplier: po.supplierId,
            supplierName: po.supplierName,
            warehouse: po.warehouseId,
            warehouseName: po.warehouseName,
            totalAmount: po.totalAmount,
            status: "PENDING",
            notes: po.notes,
            items: po.items.map((it) => ({
                product: it.productId,
                sku: it.sku,
                name: it.productName,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                totalPrice: it.totalPrice,
            })),
        });
        return mapBackendToFrontendOrder(created, "PURCHASE");
    },

    deletePurchaseOrder: async (id: string): Promise<void> => {
        await orderApi.delete(id);
    },

    createSalesOrder: async (
        so: Omit<SalesOrder, "id" | "orderNumber">,
    ): Promise<SalesOrder> => {
        const created = await orderApi.create({
            type: "SALES",
            customerName: so.customerName,
            customerPhone: so.customerPhone || "0912345678",
            shippingAddress: so.shippingAddress,
            warehouseName: so.warehouseName || "Kho Tổng Hà Nội",
            totalAmount: so.totalAmount,
            status: so.status === "Draft" ? "DRAFT" : "PENDING",
            paymentStatus: so.paymentStatus || "PENDING",
            paymentMethod: so.paymentMethod || "COD",
            notes: so.notes,
            items: so.items.map((it) => ({
                product: it.productId,
                sku: it.sku,
                name: it.productName,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                totalPrice: it.totalPrice,
            })),
        });
        return mapBackendToFrontendOrder(created, "SALES");
    },

    updatePOStatus: async (id: string, status: PurchaseOrder["status"]): Promise<PurchaseOrder> => {
        const backendStatusMap: Record<string, string> = {
            Draft: "DRAFT",
            Pending: "PENDING",
            Approved: "CONFIRMED",
            Receiving: "SHIPPING",
            Completed: "COMPLETED",
            Cancelled: "CANCELLED",
        };
        const updated = await orderApi.updateStatus(id, { status: backendStatusMap[status] || "PENDING" });
        return mapBackendToFrontendOrder(updated, "PURCHASE");
    },

    updateSOStatus: async (
        id: string,
        status: SalesOrder["status"],
    ): Promise<SalesOrder> => {
        const backendStatusMap: Record<string, string> = {
            Draft: "DRAFT",
            Pending: "PENDING",
            Processing: "CONFIRMED",
            Shipped: "SHIPPING",
            Delivered: "COMPLETED",
            Cancelled: "CANCELLED",
        };
        const updated = await orderApi.updateStatus(id, { status: backendStatusMap[status] || "PENDING" });
        return mapBackendToFrontendOrder(updated, "SALES");
    },

    updateSOPaymentStatus: async (
        id: string,
        paymentStatus: "PENDING" | "PAID" | "REFUNDED",
    ): Promise<SalesOrder> => {
        const updated = await orderApi.updateStatus(id, { paymentStatus });
        return mapBackendToFrontendOrder(updated, "SALES");
    },

    cancelOrder: async (id: string, notes?: string): Promise<SalesOrder> => {
        const updated = await orderApi.cancel(id, notes);
        return mapBackendToFrontendOrder(updated, "SALES");
    },

    createVNPayUrl: paymentApi.createVNPayUrl,
    verifyVNPay: paymentApi.verifyVNPay,

    getSuppliers: async (): Promise<Supplier[]> => {
        const list = await supplierApi.getAll();
        return list.map(mapBackendToFrontendSupplier);
    },

    createSupplier: async (supplier: Omit<Supplier, "id">): Promise<Supplier> => {
        const created = await supplierApi.create({
            name: supplier.name,
            code: supplier.code,
            contactPerson: supplier.contactPerson,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            taxId: supplier.taxId,
            category: supplier.category,
            leadTimeDays: supplier.leadTimeDays,
            rating: supplier.rating,
            status: supplier.status,
        });
        return mapBackendToFrontendSupplier(created);
    },

    updateSupplier: async (id: string, supplier: Partial<Supplier>): Promise<Supplier> => {
        const updated = await supplierApi.update(id, supplier);
        return mapBackendToFrontendSupplier(updated);
    },

    deleteSupplier: async (id: string): Promise<void> => {
        await supplierApi.delete(id);
    },

    getSupplierOrders: async (supplierId: string): Promise<PurchaseOrder[]> => {
        const orders = await supplierApi.getOrders(supplierId);
        return orders.map((bo) => mapBackendToFrontendOrder(bo, "PURCHASE"));
    },

    paySupplierOrder: async (supplierId: string, orderId: string): Promise<void> => {
        await supplierApi.payOrder(supplierId, orderId);
    },

    getSupplierStats: async () => {
        return await supplierApi.getStats();
    },

    getUsers: async (params?: {
        search?: string;
        role?: string;
        status?: string;
    }): Promise<User[]> => {
        const list = await userApi.getAll(params);
        return list.map(mapBackendToFrontendUser);
    },

    getUserStats: async (): Promise<UserStats> => {
        return await userApi.getStats();
    },

    getUserById: async (id: string): Promise<User> => {
        const user = await userApi.getById(id);
        return mapBackendToFrontendUser(user);
    },

    createUser: async (data: {
        name: string;
        email: string;
        password: string;
        role?: UserRole;
        phone?: string;
        department?: string;
        avatar?: string;
    }): Promise<User> => {
        const created = await userApi.create(data);
        return mapBackendToFrontendUser(created);
    },

    updateUser: async (
        id: string,
        data: Partial<{
            name: string;
            phone: string;
            department: string;
            avatar: string;
            role: UserRole;
            status: "ACTIVE" | "INACTIVE";
        }>,
    ): Promise<User> => {
        const updated = await userApi.update(id, data);
        return mapBackendToFrontendUser(updated);
    },

    updateUserRole: async (userId: string, role: User["role"]): Promise<User> => {
        const updated = await userApi.updateRole(userId, role);
        return mapBackendToFrontendUser(updated);
    },

    toggleUserStatus: async (userId: string): Promise<User> => {
        const updated = await userApi.toggleStatus(userId);
        return mapBackendToFrontendUser(updated);
    },

    resetUserPassword: async (userId: string, newPassword: string): Promise<void> => {
        await userApi.resetPassword(userId, newPassword);
    },

    deleteUser: async (userId: string): Promise<void> => {
        await userApi.delete(userId);
    },

    getAuditLogs: async (): Promise<AuditLog[]> => {
        const list = await auditLogApi.getAll();
        return list.map(mapBackendToFrontendAuditLog);
    },

    logAudit: async (entry: Omit<AuditLog, "id" | "timestamp" | "ipAddress">): Promise<void> => {
        await auditLogApi.create({
            user: entry.user,
            userRole: entry.userRole,
            action: entry.action,
            resource: entry.resource,
            resourceId: entry.resourceId,
            previousValue: entry.previousValue,
            newValue: entry.newValue,
        });
    },

    getCustomers: async (params?: { search?: string; segment?: string; status?: string }): Promise<Customer[]> => {
        const list = await customerApi.getAll(params);
        return list.map(mapBackendToFrontendCustomer);
    },

    getCustomerById: async (id: string) => {
        return await customerApi.getById(id);
    },

    createCustomer: async (customer: {
        name: string;
        email: string;
        phone: string;
        address?: string;
        segment?: "VIP" | "REGULAR" | "LOYAL" | "NEW";
        password?: string;
    }): Promise<Customer> => {
        const payload = {
            ...customer,
            segment: customer.segment === "REGULAR" ? ("LOYAL" as const) : customer.segment,
        };
        const res = await customerApi.create(payload);
        return mapBackendToFrontendCustomer(res);
    },

    updateCustomer: async (
        id: string,
        data: Partial<{
            name: string;
            phone: string;
            address: string;
            segment: "VIP" | "REGULAR" | "LOYAL" | "NEW";
            status: "ACTIVE" | "INACTIVE" | "BLOCKED";
        }>,
    ): Promise<Customer> => {
        const payload: any = { ...data };
        if (data.segment === "REGULAR") payload.segment = "LOYAL";
        if (data.status === "INACTIVE") payload.status = "BLOCKED";
        const res = await customerApi.update(id, payload);
        return mapBackendToFrontendCustomer(res);
    },

    deleteCustomer: async (id: string): Promise<void> => {
        await customerApi.delete(id);
    },

    getReturns: async (params?: { search?: string; status?: string; refundStatus?: string }): Promise<ReturnOrder[]> => {
        const list = await returnApi.getAll(params);
        return list.map(mapBackendToFrontendReturn);
    },

    getReturnById: async (id: string): Promise<ReturnOrder> => {
        const res = await returnApi.getById(id);
        return mapBackendToFrontendReturn(res);
    },

    createReturn: async (data: {
        orderNumber: string;
        customerName?: string;
        customerPhone?: string;
        warehouseName?: string;
        items: {
            productId: string;
            sku: string;
            name: string;
            quantity: number;
            unitPrice: number;
            refundAmount?: number;
            reason?: string;
        }[];
        returnReason: string;
        notes?: string;
    }): Promise<ReturnOrder> => {
        const res = await returnApi.create(data);
        return mapBackendToFrontendReturn(res);
    },

    updateReturnStatus: async (
        id: string,
        data: {
            status?: "PENDING" | "INSPECTED" | "RESTOCKED" | "REJECTED";
            refundStatus?: "PENDING" | "REFUNDED" | "NO_REFUND";
            inspectionNotes?: string;
        },
    ): Promise<ReturnOrder> => {
        const res = await returnApi.updateStatus(id, data);
        return mapBackendToFrontendReturn(res);
    },

    deleteReturn: async (id: string): Promise<void> => {
        await returnApi.delete(id);
    },

    getStockLevels: async (): Promise<StockItem[]> => {
        const products = await mockApi.getProducts();
        return products.map((p) => ({
            id: `stock-${p.id}`,
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            category: p.category,
            brand: p.brand || "InventoHub",
            warehouseId: p.warehouseId,
            warehouseName: p.warehouseName,
            location: p.location,
            onHand: p.stock,
            reserved: p.reservedStock,
            available: p.availableStock,
            minStock: p.minStock,
            status:
                p.stock === 0
                    ? "OUT_OF_STOCK"
                    : p.stock <= p.minStock
                      ? "LOW_STOCK"
                      : "IN_STOCK",
        }));
    },

    getDemandForecast: async (productId?: string): Promise<ProductDemandForecast> => {
        const forecast = await reportApi.getAIForecast(productId);
        return {
            productId: forecast.productId,
            productName: forecast.productName,
            sku: forecast.sku,
            currentStock: forecast.currentStock,
            averageDailySales: forecast.averageDailySales,
            forecast30Days: forecast.forecast30Days,
            recommendedReorderQty: forecast.recommendedReorderQty,
            stockoutRiskScore: forecast.stockoutRiskScore,
            reasoning: forecast.reasoning,
            chartData: forecast.chartData as any,
        };
    },

    getRevenueAnalytics: async (range?: string) => {
        return await reportApi.getRevenueAnalytics(range);
    },

    getInventoryAnalytics: async (range?: string) => {
        return await reportApi.getInventoryAnalytics(range);
    },
};
