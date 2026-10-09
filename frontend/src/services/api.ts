import axios, { AxiosInstance, AxiosError } from "axios";
import type { User, UserRole } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
    const adminToken = localStorage.getItem("inventohub_admin_token");
    const customerToken = localStorage.getItem("inventohub_customer_token");
    const isCustomerAuth = config.url?.startsWith("/auth/customer") || config.url?.startsWith("/store");
    const token = isCustomerAuth ? (customerToken || adminToken) : adminToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface ApiResponse<T> {
    thanhCong: boolean;
    thongDiep?: string;
    duLieu: T;
}

export interface BackendUser {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    status: "ACTIVE" | "INACTIVE";
    avatar?: string;
    phone?: string;
    department?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserStatsResult {
    totalUsers: number;
    adminCount: number;
    managerCount: number;
    staffCount: number;
    viewerCount: number;
    activeCount: number;
    inactiveCount: number;
}

export interface BackendCustomer {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    segment?: "VIP" | "LOYAL" | "NEW";
    totalOrders?: number;
    totalSpent?: number;
    status?: string;
}

export interface AuthAdminResult {
    nguoiDung: BackendUser;
    maXacThuc: string;
}

export interface AuthCustomerResult {
    khachHang: BackendCustomer;
    maXacThuc: string;
}

export const mapBackendUserToFrontend = (bUser: BackendUser): User => {
    return {
        id: bUser._id,
        name: bUser.name,
        email: bUser.email,
        role: bUser.role,
        avatar: bUser.avatar || "",
        department: bUser.department || "Kho vận",
        status: (bUser.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    };
};

export const authApi = {
    async adminLogin(email: string, password: string): Promise<{ user: User; token: string }> {
        const response = await apiClient.post<ApiResponse<AuthAdminResult>>("/auth/admin/login", {
            email,
            password,
        });
        const data = response.data.duLieu;
        const mappedUser = mapBackendUserToFrontend(data.nguoiDung);
        localStorage.setItem("inventohub_admin_token", data.maXacThuc);
        return { user: mappedUser, token: data.maXacThuc };
    },

    async adminGetMe(): Promise<User> {
        const response = await apiClient.get<ApiResponse<BackendUser>>("/auth/admin/me");
        return mapBackendUserToFrontend(response.data.duLieu);
    },

    async customerLogin(
        email: string,
        password: string,
    ): Promise<{ customer: BackendCustomer; token: string }> {
        const response = await apiClient.post<ApiResponse<AuthCustomerResult>>(
            "/auth/customer/login",
            {
                email,
                password,
            },
        );
        const data = response.data.duLieu;
        localStorage.setItem("inventohub_customer_token", data.maXacThuc);
        return { customer: data.khachHang, token: data.maXacThuc };
    },

    async customerRegister(data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        address?: string;
    }): Promise<{ customer: BackendCustomer; token: string }> {
        const response = await apiClient.post<ApiResponse<AuthCustomerResult>>(
            "/auth/customer/register",
            data,
        );
        const resData = response.data.duLieu;
        localStorage.setItem("inventohub_customer_token", resData.maXacThuc);
        return { customer: resData.khachHang, token: resData.maXacThuc };
    },

    async customerGetMe(): Promise<BackendCustomer> {
        const response = await apiClient.get<ApiResponse<BackendCustomer>>("/auth/customer/me");
        return response.data.duLieu;
    },

    async updateProfile(data: {
        name?: string;
        phone?: string;
        department?: string;
        avatar?: string;
        currentPassword?: string;
        newPassword?: string;
    }): Promise<User> {
        const response = await apiClient.put<ApiResponse<BackendUser>>("/auth/admin/profile", data);
        return mapBackendUserToFrontend(response.data.duLieu);
    },

    async uploadAvatar(file: File): Promise<{ url: string; publicId: string }> {
        const formData = new FormData();
        formData.append("image", file);
        const response = await apiClient.post<
            ApiResponse<{ url: string; publicId: string }>
        >("/auth/admin/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data.duLieu;
    },
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<{ thongDiep?: string; message?: string }>;
        return (
            axiosErr.response?.data?.thongDiep ||
            axiosErr.response?.data?.message ||
            axiosErr.message ||
            fallback
        );
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
};

export interface BackendCategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    status: "ACTIVE" | "INACTIVE";
    productCount?: number;
    createdAt?: string;
}

export interface BackendProduct {
    _id: string;
    sku: string;
    name: string;
    category: {
        _id: string;
        name: string;
        slug: string;
    } | string;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    unit: string;
    thumbnail: string;
    images: string[];
    description?: string;
    status: "ACTIVE" | "DRAFT" | "ARCHIVED";
    barcode?: string;
    weight?: number;
    createdAt?: string;
}

export interface ProductListResult {
    danhSach: BackendProduct[];
    phanTrang: {
        trangHienTai: number;
        tongSoTrang: number;
        tongSoBanGhi: number;
        kichThuocTrang: number;
    };
}

export const categoryApi = {
    async getAll(): Promise<BackendCategory[]> {
        const response = await apiClient.get<ApiResponse<BackendCategory[]>>("/categories");
        return response.data.duLieu;
    },

    async getById(id: string): Promise<BackendCategory> {
        const response = await apiClient.get<ApiResponse<BackendCategory>>(`/categories/${id}`);
        return response.data.duLieu;
    },

    async create(data: FormData | Partial<BackendCategory>): Promise<BackendCategory> {
        const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
        const response = await apiClient.post<ApiResponse<BackendCategory>>("/categories", data, {
            headers,
        });
        return response.data.duLieu;
    },

    async update(id: string, data: FormData | Partial<BackendCategory>): Promise<BackendCategory> {
        const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
        const response = await apiClient.put<ApiResponse<BackendCategory>>(
            `/categories/${id}`,
            data,
            { headers },
        );
        return response.data.duLieu;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/categories/${id}`);
    },
};

export const productApi = {
    async getAll(params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        status?: string;
        lowStock?: boolean;
    }): Promise<ProductListResult> {
        const response = await apiClient.get<ApiResponse<ProductListResult>>("/products", {
            params,
        });
        return response.data.duLieu;
    },

    async getById(id: string): Promise<BackendProduct> {
        const response = await apiClient.get<ApiResponse<BackendProduct>>(`/products/${id}`);
        return response.data.duLieu;
    },

    async create(data: FormData | Partial<BackendProduct>): Promise<BackendProduct> {
        const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
        const response = await apiClient.post<ApiResponse<BackendProduct>>("/products", data, {
            headers,
        });
        return response.data.duLieu;
    },

    async update(id: string, data: FormData | Partial<BackendProduct>): Promise<BackendProduct> {
        const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
        const response = await apiClient.put<ApiResponse<BackendProduct>>(`/products/${id}`, data, {
            headers,
        });
        return response.data.duLieu;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/products/${id}`);
    },

    async uploadImage(file: File): Promise<{ url: string; publicId: string }> {
        const formData = new FormData();
        formData.append("image", file);
        const response = await apiClient.post<
            ApiResponse<{ url: string; publicId: string }>
        >("/products/upload-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data.duLieu;
    },
};

export interface BackendWarehouse {
    _id: string;
    name: string;
    code: string;
    address: string;
    capacity: number;
    managerName: string;
    status: "ACTIVE" | "INACTIVE";
    zones?: any[];
    createdAt?: string;
}

export interface BackendSupplier {
    _id: string;
    name: string;
    code: string;
    contactPerson?: string;
    email: string;
    phone: string;
    address: string;
    taxId?: string;
    category?: string;
    leadTimeDays?: number;
    rating?: number;
    status: "ACTIVE" | "INACTIVE";
    activeOrders?: number;
    totalSpend?: number;
    unpaidDebt?: number;
    createdAt?: string;
}

export interface BackendOrder {
    _id: string;
    orderNumber: string;
    type: "PURCHASE" | "SALES";
    customer?: any;
    customerName?: string;
    customerPhone?: string;
    shippingAddress?: string;
    supplier?: any;
    supplierName?: string;
    warehouse?: any;
    warehouseName?: string;
    items: any[];
    totalAmount: number;
    status: "DRAFT" | "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
    paymentStatus: "PENDING" | "PAID" | "REFUNDED";
    paymentMethod?: "COD" | "VNPAY" | "TRANSFER";
    vnpTransactionNo?: string;
    vnpBankCode?: string;
    vnpPayDate?: string;
    notes?: string;
    createdAt?: string;
}

export interface BackendTransaction {
    _id: string;
    transactionCode: string;
    type: "INBOUND" | "OUTBOUND" | "TRANSFER" | "ADJUSTMENT" | "DAMAGE";
    product: any;
    productName: string;
    sku: string;
    quantity: number;
    warehouse?: any;
    warehouseName: string;
    beforeStock: number;
    afterStock: number;
    referenceCode?: string;
    performedBy: string;
    reason: string;
    createdAt?: string;
}

export interface BackendAuditLog {
    _id: string;
    user: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    previousValue?: string;
    newValue?: string;
    createdAt?: string;
}

export const warehouseApi = {
    async getAll(): Promise<BackendWarehouse[]> {
        const response = await apiClient.get<ApiResponse<BackendWarehouse[]>>("/warehouses");
        return response.data.duLieu;
    },
    async getById(id: string): Promise<BackendWarehouse> {
        const response = await apiClient.get<ApiResponse<BackendWarehouse>>(`/warehouses/${id}`);
        return response.data.duLieu;
    },
    async create(data: Partial<BackendWarehouse>): Promise<BackendWarehouse> {
        const response = await apiClient.post<ApiResponse<BackendWarehouse>>("/warehouses", data);
        return response.data.duLieu;
    },
    async update(id: string, data: Partial<BackendWarehouse>): Promise<BackendWarehouse> {
        const response = await apiClient.put<ApiResponse<BackendWarehouse>>(`/warehouses/${id}`, data);
        return response.data.duLieu;
    },
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/warehouses/${id}`);
    },
    async addZone(warehouseId: string, zoneData: { zoneName: string; code?: string }): Promise<BackendWarehouse> {
        const response = await apiClient.post<ApiResponse<BackendWarehouse>>(`/warehouses/${warehouseId}/zones`, zoneData);
        return response.data.duLieu;
    },
    async addRack(warehouseId: string, data: { zoneCode: string; rackCode: string; name?: string }): Promise<BackendWarehouse> {
        const response = await apiClient.post<ApiResponse<BackendWarehouse>>(`/warehouses/${warehouseId}/racks`, data);
        return response.data.duLieu;
    },
    async addBin(warehouseId: string, data: {
        zoneCode: string;
        rackCode: string;
        binCode: string;
        name?: string;
        capacity?: number;
        sku?: string;
        productName?: string;
        currentOccupancy?: number;
    }): Promise<BackendWarehouse> {
        const response = await apiClient.post<ApiResponse<BackendWarehouse>>(`/warehouses/${warehouseId}/bins`, data);
        return response.data.duLieu;
    },
    async updateBin(warehouseId: string, data: {
        binId: string;
        status?: "AVAILABLE" | "OCCUPIED" | "FULL" | "MAINTENANCE";
        capacity?: number;
        currentOccupancy?: number;
        sku?: string;
        productName?: string;
    }): Promise<BackendWarehouse> {
        const response = await apiClient.put<ApiResponse<BackendWarehouse>>(`/warehouses/${warehouseId}/bins`, data);
        return response.data.duLieu;
    },
    async relocateStock(data: {
        sourceWarehouseId: string;
        sourceBinCode: string;
        targetWarehouseId: string;
        targetBinCode: string;
        quantity: number;
        reason?: string;
        performedBy?: string;
    }): Promise<any> {
        const response = await apiClient.post<ApiResponse<any>>("/warehouses/relocate", data);
        return response.data.duLieu;
    },
};

export const supplierApi = {
    async getAll(): Promise<BackendSupplier[]> {
        const response = await apiClient.get<ApiResponse<BackendSupplier[]>>("/suppliers");
        return response.data.duLieu;
    },
    async getById(id: string): Promise<BackendSupplier> {
        const response = await apiClient.get<ApiResponse<BackendSupplier>>(`/suppliers/${id}`);
        return response.data.duLieu;
    },
    async create(data: Partial<BackendSupplier>): Promise<BackendSupplier> {
        const response = await apiClient.post<ApiResponse<BackendSupplier>>("/suppliers", data);
        return response.data.duLieu;
    },
    async update(id: string, data: Partial<BackendSupplier>): Promise<BackendSupplier> {
        const response = await apiClient.put<ApiResponse<BackendSupplier>>(`/suppliers/${id}`, data);
        return response.data.duLieu;
    },
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/suppliers/${id}`);
    },
    async getOrders(id: string): Promise<BackendOrder[]> {
        const response = await apiClient.get<ApiResponse<BackendOrder[]>>(`/suppliers/${id}/orders`);
        return response.data.duLieu;
    },
    async payOrder(supplierId: string, orderId: string): Promise<BackendOrder> {
        const response = await apiClient.post<ApiResponse<BackendOrder>>(`/suppliers/${supplierId}/pay-order/${orderId}`);
        return response.data.duLieu;
    },
    async getStats(): Promise<{
        totalSuppliers: number;
        activeSuppliers: number;
        totalSpend: number;
        totalUnpaidDebt: number;
        activeOrdersCount: number;
    }> {
        const response = await apiClient.get<ApiResponse<{
            totalSuppliers: number;
            activeSuppliers: number;
            totalSpend: number;
            totalUnpaidDebt: number;
            activeOrdersCount: number;
        }>>("/suppliers/stats");
        return response.data.duLieu;
    },
};

export const orderApi = {
    async getAll(params?: { type?: "PURCHASE" | "SALES"; status?: string; customer?: string }): Promise<BackendOrder[]> {
        const response = await apiClient.get<ApiResponse<BackendOrder[]>>("/orders", { params });
        return response.data.duLieu;
    },
    async getById(id: string): Promise<BackendOrder> {
        const response = await apiClient.get<ApiResponse<BackendOrder>>(`/orders/${id}`);
        return response.data.duLieu;
    },
    async create(data: Partial<BackendOrder>): Promise<BackendOrder> {
        const response = await apiClient.post<ApiResponse<BackendOrder>>("/orders", data);
        return response.data.duLieu;
    },
    async updateStatus(id: string, data: { status?: string; paymentStatus?: string; paymentMethod?: string; notes?: string }): Promise<BackendOrder> {
        const response = await apiClient.put<ApiResponse<BackendOrder>>(`/orders/${id}`, data);
        return response.data.duLieu;
    },
    async cancel(id: string, notes?: string): Promise<BackendOrder> {
        const response = await apiClient.put<ApiResponse<BackendOrder>>(`/orders/${id}/cancel`, { notes });
        return response.data.duLieu;
    },
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/orders/${id}`);
    },
};

export interface VNPayVerifyResponse {
    isValid: boolean;
    isSuccess: boolean;
    orderNumber: string;
    transactionNo: string;
    bankCode: string;
    payDate: string;
    amount: number;
    responseCode: string;
    message: string;
    order?: any;
}

export const paymentApi = {
    async createVNPayUrl(data: { orderId?: string; orderNumber?: string }): Promise<{
        paymentUrl: string;
        orderNumber: string;
        totalAmount: number;
    }> {
        const response = await apiClient.post<ApiResponse<{
            paymentUrl: string;
            orderNumber: string;
            totalAmount: number;
        }>>("/payment/vnpay/create-url", data);
        return response.data.duLieu;
    },
    async verifyVNPay(params: Record<string, string>): Promise<VNPayVerifyResponse> {
        const response = await apiClient.post<ApiResponse<VNPayVerifyResponse>>("/payment/vnpay/verify", params);
        return response.data.duLieu;
    },
};

export const transactionApi = {
    async getAll(params?: { productId?: string; type?: string }): Promise<BackendTransaction[]> {
        const response = await apiClient.get<ApiResponse<BackendTransaction[]>>("/transactions", { params });
        return response.data.duLieu;
    },
    async create(data: {
        type: string;
        productId: string;
        quantity: number;
        warehouseName?: string;
        reason?: string;
        performedBy?: string;
        referenceCode?: string;
    }): Promise<BackendTransaction> {
        const response = await apiClient.post<ApiResponse<BackendTransaction>>("/transactions", data);
        return response.data.duLieu;
    },
};

export const auditLogApi = {
    async getAll(): Promise<BackendAuditLog[]> {
        const response = await apiClient.get<ApiResponse<BackendAuditLog[]>>("/audit-logs");
        return response.data.duLieu;
    },
    async create(data: Partial<BackendAuditLog>): Promise<BackendAuditLog> {
        const response = await apiClient.post<ApiResponse<BackendAuditLog>>("/audit-logs", data);
        return response.data.duLieu;
    },
};

export interface RevenueAnalyticsResult {
    metrics: {
        totalRevenue: number;
        totalCost?: number;
        grossProfit?: number;
        profitMargin?: number;
        orderCount: number;
        aov: number;
        successRate: number;
    };
    paymentDistribution?: Array<{
        name: string;
        value: number;
        count: number;
        key: string;
    }>;
    revenueTimeline: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
    categoryRevenue: Array<{
        name: string;
        value: number;
    }>;
    topSellingProducts: Array<{
        name: string;
        sku: string;
        qty: number;
        revenue: number;
    }>;
}

export interface InventoryAnalyticsResult {
    metrics: {
        totalStock: number;
        totalValuation: number;
        lowStockCount: number;
        outOfStockCount: number;
        totalInbound: number;
        totalOutbound: number;
    };
    turnoverData: Array<{
        period: string;
        turnover: number;
        benchmark: number;
    }>;
    topSelling: Array<{
        id: string;
        name: string;
        sku: string;
        unitsSold: number;
        revenue: number;
        stock: number;
    }>;
    slowMoving: Array<{
        id: string;
        name: string;
        sku: string;
        daysInWarehouse: number;
        idleUnits: number;
        capitalTied: number;
    }>;
    movementData: Array<{
        category: string;
        inbound: number;
        outbound: number;
    }>;
}

export interface AIForecastResult {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    averageDailySales: number;
    forecast30Days: number;
    recommendedReorderQty: number;
    stockoutRiskScore: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    reasoning: string;
    chartData: Array<{
        date: string;
        historical?: number;
        predicted: number;
        lowerBound?: number;
        upperBound?: number;
    }>;
}

export const reportApi = {
    async getRevenueAnalytics(range?: string): Promise<RevenueAnalyticsResult> {
        const response = await apiClient.get<ApiResponse<RevenueAnalyticsResult>>(
            "/reports/revenue-analytics",
            { params: { range } },
        );
        return response.data.duLieu;
    },
    async getInventoryAnalytics(range?: string): Promise<InventoryAnalyticsResult> {
        const response = await apiClient.get<ApiResponse<InventoryAnalyticsResult>>(
            "/reports/inventory-analytics",
            { params: { range } },
        );
        return response.data.duLieu;
    },
    async getAIForecast(productId?: string): Promise<AIForecastResult> {
        const response = await apiClient.get<ApiResponse<AIForecastResult>>(
            "/reports/ai-forecast",
            { params: { productId } },
        );
        return response.data.duLieu;
    },
};

export interface AIAskResponse {
    reply: string;
    suggestions: string[];
}

export interface AIWarehouseSnapshot {
    totalProducts: number;
    totalUnits: number;
    totalValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockItems: Array<{
        name: string;
        sku: string;
        stock: number;
        minStock: number;
    }>;
    outOfStockItems: Array<{
        name: string;
        sku: string;
        minStock: number;
    }>;
    topSellingProducts: Array<{
        name: string;
        quantitySold: number;
        revenue: number;
    }>;
    unpaidSupplierDebt: number;
    pendingPurchaseOrdersCount: number;
    warehousesCount: number;
    recentTransactionsCount: number;
}

export interface AIReorderAdvice {
    productId: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    reorderPoint: number;
    economicOrderQuantity: number;
    averageDailySales: number;
    daysRemaining: number;
    isUrgent: boolean;
    shouldReorder: boolean;
}

export interface AIChatSessionSummary {
    id: string;
    title: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    lastMessage: string;
}

export interface AIChatSessionDetail {
    id: string;
    title: string;
    messages: Array<{
        id: string;
        sender: "user" | "assistant";
        text: string;
        timestamp: string;
        suggestions?: string[];
    }>;
    createdAt: string;
    updatedAt: string;
}

export const aiApi = {
    async askAssistant(
        question: string,
        contextSummary?: string,
    ): Promise<AIAskResponse> {
        const response = await apiClient.post<ApiResponse<AIAskResponse>>("/ai/ask", {
            question,
            contextSummary,
        });
        return response.data.duLieu;
    },
    async getWarehouseSnapshot(): Promise<AIWarehouseSnapshot> {
        const response = await apiClient.get<ApiResponse<AIWarehouseSnapshot>>(
            "/ai/snapshot",
        );
        return response.data.duLieu;
    },
    async getReorderAdvice(): Promise<AIReorderAdvice[]> {
        const response = await apiClient.get<ApiResponse<AIReorderAdvice[]>>(
            "/ai/reorder-advice",
        );
        return response.data.duLieu;
    },
    async generateDescription(data: {
        name: string;
        category?: string;
        brand?: string;
    }): Promise<string> {
        const response = await apiClient.post<ApiResponse<{ description: string }>>(
            "/ai/generate-description",
            data,
        );
        return response.data.duLieu.description;
    },
    async getSessions(): Promise<AIChatSessionSummary[]> {
        const response = await apiClient.get<ApiResponse<AIChatSessionSummary[]>>("/ai/sessions");
        return response.data.duLieu;
    },
    async getSessionById(id: string): Promise<AIChatSessionDetail> {
        const response = await apiClient.get<ApiResponse<AIChatSessionDetail>>(`/ai/sessions/${id}`);
        return response.data.duLieu;
    },
    async createSession(title?: string): Promise<AIChatSessionDetail> {
        const response = await apiClient.post<ApiResponse<AIChatSessionDetail>>("/ai/sessions", {
            title,
        });
        return response.data.duLieu;
    },
    async sendMessage(
        sessionId: string,
        question: string,
        contextSummary?: string,
    ): Promise<{
        sessionId: string;
        title: string;
        messages: AIChatSessionDetail["messages"];
        reply: string;
        suggestions: string[];
    }> {
        const response = await apiClient.post<
            ApiResponse<{
                sessionId: string;
                title: string;
                messages: AIChatSessionDetail["messages"];
                reply: string;
                suggestions: string[];
            }>
        >(`/ai/sessions/${sessionId}/messages`, {
            question,
            contextSummary,
        });
        return response.data.duLieu;
    },
    async deleteSession(id: string): Promise<void> {
        await apiClient.delete(`/ai/sessions/${id}`);
    },
    async renameSession(id: string, title: string): Promise<{ id: string; title: string }> {
        const response = await apiClient.patch<ApiResponse<{ id: string; title: string }>>(
            `/ai/sessions/${id}/title`,
            { title },
        );
        return response.data.duLieu;
    },
};

export const userApi = {
    async getAll(params?: {
        search?: string;
        role?: string;
        status?: string;
    }): Promise<BackendUser[]> {
        const response = await apiClient.get<ApiResponse<BackendUser[]>>("/users", { params });
        return response.data.duLieu;
    },
    async getStats(): Promise<UserStatsResult> {
        const response = await apiClient.get<ApiResponse<UserStatsResult>>("/users/stats");
        return response.data.duLieu;
    },
    async getById(id: string): Promise<BackendUser> {
        const response = await apiClient.get<ApiResponse<BackendUser>>(`/users/${id}`);
        return response.data.duLieu;
    },
    async create(data: {
        name: string;
        email: string;
        password: string;
        role?: UserRole;
        phone?: string;
        department?: string;
        avatar?: string;
    }): Promise<BackendUser> {
        const response = await apiClient.post<ApiResponse<BackendUser>>("/users", data);
        return response.data.duLieu;
    },
    async update(
        id: string,
        data: Partial<{
            name: string;
            phone: string;
            department: string;
            avatar: string;
            role: UserRole;
            status: "ACTIVE" | "INACTIVE";
        }>,
    ): Promise<BackendUser> {
        const response = await apiClient.put<ApiResponse<BackendUser>>(`/users/${id}`, data);
        return response.data.duLieu;
    },
    async updateRole(id: string, role: UserRole): Promise<BackendUser> {
        const response = await apiClient.patch<ApiResponse<BackendUser>>(`/users/${id}/role`, {
            role,
        });
        return response.data.duLieu;
    },
    async toggleStatus(id: string): Promise<BackendUser> {
        const response = await apiClient.patch<ApiResponse<BackendUser>>(`/users/${id}/status`);
        return response.data.duLieu;
    },
    async resetPassword(id: string, newPassword: string): Promise<void> {
        await apiClient.patch<ApiResponse<null>>(`/users/${id}/reset-password`, {
            newPassword,
        });
    },
    async delete(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
    },
};

export interface BackendReturnItem {
    product: any;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    reason?: string;
}

export interface BackendReturn {
    _id: string;
    rmaNumber: string;
    order?: any;
    orderNumber: string;
    customer?: any;
    customerName: string;
    customerPhone: string;
    warehouse?: any;
    warehouseName: string;
    items: BackendReturnItem[];
    returnReason: string;
    status: "PENDING" | "INSPECTED" | "RESTOCKED" | "REJECTED";
    refundStatus: "PENDING" | "REFUNDED" | "NO_REFUND";
    totalRefundAmount: number;
    inspectionNotes?: string;
    performedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export const customerApi = {
    async getAll(params?: {
        search?: string;
        segment?: string;
        status?: string;
    }): Promise<BackendCustomer[]> {
        const response = await apiClient.get<ApiResponse<BackendCustomer[]>>("/customers", { params });
        return response.data.duLieu;
    },
    async getById(id: string): Promise<{ customer: BackendCustomer; orders: any[]; metrics: any }> {
        const response = await apiClient.get<ApiResponse<{ customer: BackendCustomer; orders: any[]; metrics: any }>>(`/customers/${id}`);
        return response.data.duLieu;
    },
    async create(data: {
        name: string;
        email: string;
        phone: string;
        address?: string;
        segment?: "VIP" | "LOYAL" | "NEW" | "REGULAR";
        password?: string;
    }): Promise<BackendCustomer> {
        const response = await apiClient.post<ApiResponse<BackendCustomer>>("/customers", data);
        return response.data.duLieu;
    },
    async update(
        id: string,
        data: Partial<{
            name: string;
            phone: string;
            address: string;
            segment: "VIP" | "LOYAL" | "NEW" | "REGULAR";
            status: "ACTIVE" | "BLOCKED" | "INACTIVE";
        }>,
    ): Promise<BackendCustomer> {
        const response = await apiClient.put<ApiResponse<BackendCustomer>>(`/customers/${id}`, data);
        return response.data.duLieu;
    },
    async delete(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(`/customers/${id}`);
    },
};

export const returnApi = {
    async getAll(params?: {
        search?: string;
        status?: string;
        refundStatus?: string;
    }): Promise<BackendReturn[]> {
        const response = await apiClient.get<ApiResponse<BackendReturn[]>>("/returns", { params });
        return response.data.duLieu;
    },
    async getById(id: string): Promise<BackendReturn> {
        const response = await apiClient.get<ApiResponse<BackendReturn>>(`/returns/${id}`);
        return response.data.duLieu;
    },
    async create(data: {
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
    }): Promise<BackendReturn> {
        const response = await apiClient.post<ApiResponse<BackendReturn>>("/returns", data);
        return response.data.duLieu;
    },
    async updateStatus(
        id: string,
        data: {
            status?: "PENDING" | "INSPECTED" | "RESTOCKED" | "REJECTED";
            refundStatus?: "PENDING" | "REFUNDED" | "NO_REFUND";
            inspectionNotes?: string;
        },
    ): Promise<BackendReturn> {
        const response = await apiClient.put<ApiResponse<BackendReturn>>(`/returns/${id}/status`, data);
        return response.data.duLieu;
    },
    async delete(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(`/returns/${id}`);
    },
};




