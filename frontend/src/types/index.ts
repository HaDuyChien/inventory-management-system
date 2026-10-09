export type UserRole = "ADMIN" | "WAREHOUSE_MANAGER" | "WAREHOUSE_STAFF" | "VIEWER";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    department?: string;
    status: "ACTIVE" | "INACTIVE";
    lastLogin?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserStats {
    totalUsers: number;
    adminCount: number;
    managerCount: number;
    staffCount: number;
    viewerCount: number;
    activeCount: number;
    inactiveCount: number;
}

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export interface SerialNumber {
    id: string;
    serial: string;
    status: "IN_STOCK" | "ALLOCATED" | "SOLD" | "DEFECTIVE";
    location: string;
    receivedAt: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    brand: string;
    model?: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    reservedStock: number;
    availableStock: number;
    minStock: number;
    warehouseId: string;
    warehouseName: string;
    location: string;
    warranty: string;
    status: ProductStatus;
    image: string;
    description: string;
    barcode?: string;
    serialNumbers?: SerialNumber[];
    createdAt: string;
    updatedAt: string;
}

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface StockItem {
    id: string;
    productId: string;
    productName: string;
    sku: string;
    category: string;
    brand: string;
    onHand: number;
    reserved: number;
    available: number;
    minStock: number;
    warehouseId: string;
    warehouseName: string;
    location: string;
    status: StockStatus;
}

export type TransactionType =
    "INBOUND" | "OUTBOUND" | "RETURN" | "DAMAGE" | "ADJUSTMENT" | "TRANSFER";

export interface InventoryTransaction {
    id: string;
    date: string;
    productId: string;
    productName: string;
    sku: string;
    type: TransactionType;
    quantity: number;
    before: number;
    after: number;
    user: string;
    reference: string;
    notes?: string;
}

export interface BinLocation {
    id: string;
    name: string;
    binCode?: string;
    capacity: number;
    occupancy: number;
    status: "AVAILABLE" | "OCCUPIED" | "FULL" | "MAINTENANCE";
    sku?: string;
    productName?: string;
    product?: string;
}

export interface RackLocation {
    id: string;
    name: string;
    bins: BinLocation[];
}

export interface ZoneLocation {
    id: string;
    name: string;
    code: string;
    racks: RackLocation[];
}

export interface Warehouse {
    id: string;
    name: string;
    code: string;
    address: string;
    city: string;
    manager: string;
    totalCapacity: number;
    occupiedCapacity: number;
    zonesCount: number;
    racksCount: number;
    binsCount: number;
    zones: ZoneLocation[];
    createdAt: string;
}

export type POStatus = "Draft" | "Pending" | "Approved" | "Receiving" | "Completed" | "Cancelled";

export interface OrderLineItem {
    id: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId: string;
    supplierName: string;
    warehouseId: string;
    warehouseName: string;
    status: POStatus;
    orderDate: string;
    expectedDelivery: string;
    items: OrderLineItem[];
    subtotal: number;
    tax: number;
    totalAmount: number;
    notes?: string;
    createdByUser: string;
}

export type SOStatus = "Draft" | "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface SalesOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    warehouseId: string;
    warehouseName: string;
    status: SOStatus;
    paymentStatus?: "PENDING" | "PAID" | "REFUNDED";
    paymentMethod?: "COD" | "VNPAY" | "TRANSFER";
    vnpTransactionNo?: string;
    vnpBankCode?: string;
    vnpPayDate?: string;
    orderDate: string;
    items: OrderLineItem[];
    subtotal: number;
    tax: number;
    totalAmount: number;
    shippingAddress: string;
    notes?: string;
}

export interface Supplier {
    id: string;
    name: string;
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    taxId?: string;
    category: string;
    leadTimeDays: number;
    rating: number;
    activeOrders: number;
    totalSpend: number;
    unpaidDebt?: number;
    status: "ACTIVE" | "INACTIVE";
}

export interface AuditLog {
    id: string;
    user: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId: string;
    previousValue: string;
    newValue: string;
    timestamp: string;
    ipAddress: string;
}

export interface ForecastDataPoint {
    date: string;
    historical?: number;
    predicted?: number;
    lowerBound?: number;
    upperBound?: number;
}

export interface ProductDemandForecast {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    averageDailySales: number;
    forecast30Days: number;
    recommendedReorderQty: number;
    stockoutRiskScore: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    chartData: ForecastDataPoint[];
    reasoning: string;
}

export interface AIMessage {
    id: string;
    sender: "user" | "assistant";
    timestamp: string;
    text: string;
    structuredData?: {
        type: "reorder_recommendation" | "low_stock_table" | "forecast_summary" | "top_products";
        title: string;
        items?: any[];
        chart?: any;
        actions?: { label: string; action: string; variant?: "primary" | "secondary" }[];
    };
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    status: "ACTIVE" | "INACTIVE";
    segment: "VIP" | "REGULAR" | "NEW";
}

export interface ReturnItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    reason?: string;
}

export interface ReturnOrder {
    id: string;
    rmaNumber: string;
    orderId?: string;
    orderNumber: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    warehouseId?: string;
    warehouseName: string;
    items: ReturnItem[];
    returnReason: string;
    status: "Pending" | "Inspected" | "Restocked" | "Rejected";
    refundStatus: "Pending" | "Refunded" | "NoRefund";
    totalRefundAmount: number;
    inspectionNotes?: string;
    performedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export const INVENTOHUB_DOMAIN_VERSION = "1.0.0";
