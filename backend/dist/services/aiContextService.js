"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReorderAdviceList = exports.getWarehouseContextSnapshot = exports.clearWarehouseContextCache = void 0;
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
const Supplier_1 = require("../models/Supplier");
const Transaction_1 = require("../models/Transaction");
const Warehouse_1 = require("../models/Warehouse");
let cachedSnapshot = null;
const SNAPSHOT_CACHE_TTL = 2 * 60 * 1000;
const clearWarehouseContextCache = () => {
    cachedSnapshot = null;
};
exports.clearWarehouseContextCache = clearWarehouseContextCache;
const getWarehouseContextSnapshot = async () => {
    const now = Date.now();
    if (cachedSnapshot && now < cachedSnapshot.expiry) {
        return cachedSnapshot.data;
    }
    const products = await Product_1.Product.find();
    const warehouses = await Warehouse_1.Warehouse.find();
    const suppliers = await Supplier_1.Supplier.find();
    let totalUnits = 0;
    let totalValuation = 0;
    const lowStockItems = [];
    const outOfStockItems = [];
    for (const p of products) {
        totalUnits += p.stock;
        totalValuation += p.stock * p.costPrice;
        if (p.stock === 0) {
            outOfStockItems.push({
                name: p.name,
                sku: p.sku,
                minStock: p.minStock,
            });
        }
        else if (p.stock <= p.minStock) {
            lowStockItems.push({
                name: p.name,
                sku: p.sku,
                stock: p.stock,
                minStock: p.minStock,
            });
        }
    }
    const salesOrders = await Order_1.Order.find({ type: "SALES" });
    const productSalesMap = new Map();
    for (const order of salesOrders) {
        if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
                const itemName = item.name || item.sku;
                const existing = productSalesMap.get(itemName) || {
                    name: itemName,
                    quantitySold: 0,
                    revenue: 0,
                };
                existing.quantitySold += item.quantity || 0;
                existing.revenue += item.totalPrice || 0;
                productSalesMap.set(itemName, existing);
            }
        }
    }
    const topSellingProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);
    const purchaseOrders = await Order_1.Order.find({ type: "PURCHASE" });
    const pendingPurchaseOrdersCount = purchaseOrders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length;
    const unpaidSupplierDebt = purchaseOrders
        .filter((o) => o.status !== "CANCELLED" && o.paymentStatus === "PENDING")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const recentTransactionsCount = await Transaction_1.Transaction.countDocuments();
    const snapshot = {
        totalProducts: products.length,
        totalUnits,
        totalValuation,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems,
        outOfStockItems,
        topSellingProducts,
        unpaidSupplierDebt,
        pendingPurchaseOrdersCount,
        warehousesCount: warehouses.length,
        recentTransactionsCount,
    };
    const lines = [
        `Dữ liệu thời gian thực của hệ thống kho InventoHub:`,
        `- Tổng số sản phẩm quản lý: ${products.length} mã hàng`,
        `- Tổng số lượng tồn kho: ${totalUnits.toLocaleString("vi-VN")} đơn vị`,
        `- Tổng giá trị tài sản tồn kho: ${totalValuation.toLocaleString("vi-VN")} đồng`,
        `- Số sản phẩm đã hết sạch hàng: ${outOfStockItems.length} mã`,
        `- Số sản phẩm đang dưới ngưỡng an toàn: ${lowStockItems.length} mã`,
        `- Tổng công nợ nhà cung cấp chưa thanh toán: ${unpaidSupplierDebt.toLocaleString("vi-VN")} đồng`,
        `- Số đơn mua hàng đang chờ xử lý hoặc giao: ${pendingPurchaseOrdersCount} đơn`,
        `- Số địa điểm kho đang vận hành: ${warehouses.length} kho`,
        `- Tổng số nhà cung cấp đối tác: ${suppliers.length} đơn vị`,
    ];
    if (outOfStockItems.length > 0) {
        lines.push(`Các mặt hàng đã hết hàng:`);
        for (const item of outOfStockItems.slice(0, 5)) {
            lines.push(`  + ${item.name} - Mã SKU: ${item.sku} - Ngưỡng tối thiểu: ${item.minStock}`);
        }
    }
    if (lowStockItems.length > 0) {
        lines.push(`Các mặt hàng đang sắp hết hàng:`);
        for (const item of lowStockItems.slice(0, 5)) {
            lines.push(`  + ${item.name} - Mã SKU: ${item.sku} - Tồn hiện tại: ${item.stock} - Tối thiểu: ${item.minStock}`);
        }
    }
    if (topSellingProducts.length > 0) {
        lines.push(`Top sản phẩm bán chạy nhất:`);
        for (const item of topSellingProducts) {
            lines.push(`  + ${item.name}: Đã bán ${item.quantitySold} cái, doanh thu ${item.revenue.toLocaleString("vi-VN")} đồng`);
        }
    }
    const result = {
        snapshot,
        summaryText: lines.join("\n"),
    };
    cachedSnapshot = {
        data: result,
        expiry: Date.now() + SNAPSHOT_CACHE_TTL,
    };
    return result;
};
exports.getWarehouseContextSnapshot = getWarehouseContextSnapshot;
const getReorderAdviceList = async () => {
    const products = await Product_1.Product.find();
    const salesOrders = await Order_1.Order.find({ type: "SALES" });
    const adviceList = [];
    for (const p of products) {
        let totalSold = 0;
        for (const order of salesOrders) {
            if (order.items && Array.isArray(order.items)) {
                for (const item of order.items) {
                    if ((item.product && item.product.toString() === p._id.toString()) ||
                        item.sku === p.sku ||
                        item.name === p.name) {
                        totalSold += item.quantity || 0;
                    }
                }
            }
        }
        const avgDailySales = Math.max(1, Math.round(totalSold / 30));
        const leadTimeDays = 5;
        const safetyStock = p.minStock || 10;
        const reorderPoint = avgDailySales * leadTimeDays + safetyStock;
        const isLow = p.stock <= reorderPoint;
        const annualDemand = avgDailySales * 365;
        const orderCost = 200000;
        const holdingCost = Math.max(10000, p.costPrice * 0.15);
        const eoq = Math.round(Math.sqrt((2 * annualDemand * orderCost) / holdingCost));
        const daysRemaining = avgDailySales > 0 ? Math.round(p.stock / avgDailySales) : 999;
        adviceList.push({
            productId: p._id,
            name: p.name,
            sku: p.sku,
            currentStock: p.stock,
            minStock: p.minStock,
            reorderPoint,
            economicOrderQuantity: eoq,
            averageDailySales: avgDailySales,
            daysRemaining,
            isUrgent: p.stock <= p.minStock,
            shouldReorder: isLow,
        });
    }
    return adviceList.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent)
            return -1;
        if (!a.isUrgent && b.isUrgent)
            return 1;
        return a.daysRemaining - b.daysRemaining;
    });
};
exports.getReorderAdviceList = getReorderAdviceList;
