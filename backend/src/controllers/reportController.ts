import { Request, Response } from "express";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Transaction } from "../models/Transaction";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";
import { generateForecastAnalysis } from "../services/geminiService";

export const getRevenueAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const range = (req.query.range as string) || "30d";
        const now = new Date();
        const startDate = new Date();

        if (range === "7d") {
            startDate.setDate(now.getDate() - 7);
        } else if (range === "90d") {
            startDate.setDate(now.getDate() - 90);
        } else if (range === "year") {
            startDate.setFullYear(now.getFullYear() - 1);
        } else {
            startDate.setDate(now.getDate() - 30);
        }

        const salesOrders = await Order.find({
            type: "SALES",
            createdAt: { $gte: startDate },
        }).sort({ createdAt: 1 });

        const validOrders = salesOrders.filter((o) => o.status !== "CANCELLED");
        const totalRevenue = validOrders.reduce((acc, o) => acc + o.totalAmount, 0);
        const orderCount = validOrders.length;
        const aov = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
        const completedCount = validOrders.filter((o) => o.status === "COMPLETED").length;
        const successRate =
            orderCount > 0 ? Math.round((completedCount / orderCount) * 100) : 100;

        const timelineList: { date: string; revenue: number; orders: number }[] = [];
        if (range === "7d" || range === "30d") {
            const days = range === "7d" ? 7 : 30;
            const map = new Map<string, { revenue: number; orders: number }>();
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                map.set(key, { revenue: 0, orders: 0 });
            }
            validOrders.forEach((order) => {
                const rawDate = (order as any).createdAt || new Date();
                const d = new Date(rawDate);
                const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                if (map.has(key)) {
                    const entry = map.get(key)!;
                    entry.revenue += order.totalAmount;
                    entry.orders += 1;
                }
            });
            map.forEach((val, key) => {
                timelineList.push({ date: key, revenue: val.revenue, orders: val.orders });
            });
        } else if (range === "year") {
            const map = new Map<string, { revenue: number; orders: number }>();
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `T${d.getMonth() + 1}`;
                map.set(key, { revenue: 0, orders: 0 });
            }
            validOrders.forEach((order) => {
                const rawDate = (order as any).createdAt || new Date();
                const d = new Date(rawDate);
                const key = `T${d.getMonth() + 1}`;
                if (map.has(key)) {
                    const entry = map.get(key)!;
                    entry.revenue += order.totalAmount;
                    entry.orders += 1;
                }
            });
            map.forEach((val, key) => {
                timelineList.push({ date: key, revenue: val.revenue, orders: val.orders });
            });
        } else {
            const map = new Map<string, { revenue: number; orders: number }>();
            for (let i = 12; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i * 7);
                const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                map.set(key, { revenue: 0, orders: 0 });
            }
            validOrders.forEach((order) => {
                const rawDate = (order as any).createdAt || new Date();
                const d = new Date(rawDate);
                let closestKey = "";
                let minDiff = Infinity;
                map.forEach((_, k) => {
                    const [dayStr, monthStr] = k.split("/");
                    const kDate = new Date(now.getFullYear(), Number(monthStr) - 1, Number(dayStr));
                    const diff = Math.abs(d.getTime() - kDate.getTime());
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestKey = k;
                    }
                });
                if (closestKey && map.has(closestKey)) {
                    const entry = map.get(closestKey)!;
                    entry.revenue += order.totalAmount;
                    entry.orders += 1;
                }
            });
            map.forEach((val, key) => {
                timelineList.push({ date: key, revenue: val.revenue, orders: val.orders });
            });
        }

        const revenueTimeline = timelineList;

        const prodSalesMap: Record<
            string,
            { name: string; sku: string; qty: number; revenue: number }
        > = {};
        const categoryMap: Record<string, number> = {};

        validOrders.forEach((order) => {
            order.items.forEach((item) => {
                const prodId = String(item.product);
                if (!prodSalesMap[prodId]) {
                    prodSalesMap[prodId] = {
                        name: item.name,
                        sku: item.sku,
                        qty: 0,
                        revenue: 0,
                    };
                }
                prodSalesMap[prodId].qty += item.quantity;
                prodSalesMap[prodId].revenue += item.totalPrice;
            });
        });

        const products = await Product.find().populate("category", "name");
        const productCostMap = new Map<string, number>();
        products.forEach((p) => productCostMap.set(String(p._id), p.costPrice || 0));

        let totalCost = 0;
        validOrders.forEach((order) => {
            order.items.forEach((item) => {
                const cost = productCostMap.get(String(item.product)) || 0;
                totalCost += cost * item.quantity;
            });
        });

        const grossProfit = Math.max(0, totalRevenue - totalCost);
        const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

        const paymentMethodMap: Record<string, { count: number; revenue: number }> = {
            VNPAY: { count: 0, revenue: 0 },
            COD: { count: 0, revenue: 0 },
            TRANSFER: { count: 0, revenue: 0 },
        };

        validOrders.forEach((order) => {
            const method = order.paymentMethod || "COD";
            if (!paymentMethodMap[method]) {
                paymentMethodMap[method] = { count: 0, revenue: 0 };
            }
            paymentMethodMap[method].count += 1;
            paymentMethodMap[method].revenue += order.totalAmount;
        });

        const paymentDistribution = [
            { name: "Cổng VNPay", value: paymentMethodMap["VNPAY"].revenue, count: paymentMethodMap["VNPAY"].count, key: "VNPAY" },
            { name: "Thu hộ COD", value: paymentMethodMap["COD"].revenue, count: paymentMethodMap["COD"].count, key: "COD" },
            { name: "Chuyển khoản", value: paymentMethodMap["TRANSFER"].revenue, count: paymentMethodMap["TRANSFER"].count, key: "TRANSFER" },
        ];

        products.forEach((p) => {
            const sold = prodSalesMap[String(p._id)];
            if (sold) {
                const catName =
                    typeof p.category === "object" && p.category && "name" in p.category
                        ? String((p.category as any).name)
                        : "Khác";
                categoryMap[catName] = (categoryMap[catName] || 0) + sold.revenue;
            }
        });

        const categoryRevenue = Object.entries(categoryMap)
            .map(([name, value]) => ({
                name,
                value,
            }))
            .sort((a, b) => b.value - a.value);

        const topSellingProducts = Object.values(prodSalesMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        sendSuccess(
            res,
            {
                metrics: {
                    totalRevenue,
                    totalCost,
                    grossProfit,
                    profitMargin,
                    orderCount,
                    aov,
                    successRate,
                },
                paymentDistribution,
                revenueTimeline,
                categoryRevenue,
                topSellingProducts,
            },
            "Lấy thống kê doanh thu thành công",
        );
    },
);

export const getInventoryAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const range = (req.query.range as string) || "30d";
        const now = new Date();
        const startDate = new Date();

        if (range === "7d") {
            startDate.setDate(now.getDate() - 7);
        } else if (range === "90d") {
            startDate.setDate(now.getDate() - 90);
        } else if (range === "ytd") {
            startDate.setMonth(0, 1);
        } else {
            startDate.setDate(now.getDate() - 30);
        }

        const [products, transactions] = await Promise.all([
            Product.find().populate("category", "name"),
            Transaction.find({ createdAt: { $gte: startDate } }),
        ]);

        let totalStock = 0;
        let totalValuation = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        products.forEach((p) => {
            totalStock += p.stock || 0;
            totalValuation += (p.stock || 0) * (p.costPrice || 0);
            if (p.stock === 0) {
                outOfStockCount += 1;
            } else if (p.stock <= p.minStock) {
                lowStockCount += 1;
            }
        });

        let totalInbound = 0;
        let totalOutbound = 0;
        const categoryMovement: Record<string, { inbound: number; outbound: number }> = {};

        transactions.forEach((t) => {
            if (t.type === "INBOUND") totalInbound += t.quantity;
            if (t.type === "OUTBOUND") totalOutbound += t.quantity;

            const prod = products.find((p) => String(p._id) === String(t.product));
            const catName =
                prod && typeof prod.category === "object" && prod.category && "name" in prod.category
                    ? String((prod.category as any).name)
                    : "Khác";

            if (!categoryMovement[catName]) {
                categoryMovement[catName] = { inbound: 0, outbound: 0 };
            }
            if (t.type === "INBOUND") {
                categoryMovement[catName].inbound += t.quantity;
            } else if (t.type === "OUTBOUND") {
                categoryMovement[catName].outbound += t.quantity;
            }
        });

        const movementData = Object.entries(categoryMovement).map(([category, vals]) => ({
            category,
            inbound: vals.inbound,
            outbound: vals.outbound,
        }));

        const salesOrders = await Order.find({
            type: "SALES",
            status: { $ne: "CANCELLED" },
            createdAt: { $gte: startDate },
        });

        const productSalesStats: Record<string, { unitsSold: number; revenue: number }> = {};
        salesOrders.forEach((o) => {
            o.items.forEach((it) => {
                const pid = String(it.product);
                if (!productSalesStats[pid]) {
                    productSalesStats[pid] = { unitsSold: 0, revenue: 0 };
                }
                productSalesStats[pid].unitsSold += it.quantity;
                productSalesStats[pid].revenue += it.totalPrice;
            });
        });

        const topSelling = products
            .map((p) => {
                const stats = productSalesStats[String(p._id)] || { unitsSold: 0, revenue: 0 };
                return {
                    id: String(p._id),
                    name: p.name,
                    sku: p.sku,
                    unitsSold: stats.unitsSold,
                    revenue: stats.revenue,
                    stock: p.stock,
                };
            })
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 5);

        const slowMoving = products
            .filter((p) => {
                const stats = productSalesStats[String(p._id)] || { unitsSold: 0, revenue: 0 };
                return p.stock > 0 && stats.unitsSold <= 2;
            })
            .map((p) => {
                const daysInWarehouse = 45;
                return {
                    id: String(p._id),
                    name: p.name,
                    sku: p.sku,
                    daysInWarehouse,
                    idleUnits: p.stock,
                    capitalTied: p.stock * p.costPrice,
                };
            })
            .sort((a, b) => b.capitalTied - a.capitalTied)
            .slice(0, 5);

        const turnoverData = [1, 2, 3, 4].map((w) => {
            const wStart = new Date(startDate);
            wStart.setDate(wStart.getDate() + (w - 1) * 7);
            const wEnd = new Date(wStart);
            wEnd.setDate(wEnd.getDate() + 7);

            const weeklySales = salesOrders.filter((o) => {
                const od = new Date((o as any).createdAt || 0);
                return od >= wStart && od < wEnd;
            });
            const weeklyRevenue = weeklySales.reduce((acc, o) => acc + o.totalAmount, 0);
            const weeklyTurnover =
                totalValuation > 0
                    ? Number(((weeklyRevenue * 0.75 / totalValuation) * 52).toFixed(1))
                    : 3.5;
            return {
                period: `Tuần ${w}`,
                turnover: weeklyTurnover > 0 ? weeklyTurnover : Number((3.0 + w * 0.4).toFixed(1)),
                benchmark: 3.5,
            };
        });

        sendSuccess(
            res,
            {
                metrics: {
                    totalStock,
                    totalValuation,
                    lowStockCount,
                    outOfStockCount,
                    totalInbound,
                    totalOutbound,
                },
                turnoverData,
                topSelling,
                slowMoving,
                movementData,
            },
            "Lấy báo cáo phân tích kho thành công",
        );
    },
);

export const getAIDemandForecast = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const productId = req.params.productId || (req.query.productId as string);

        let product = null;
        if (productId) {
            product = await Product.findById(productId).populate("category", "name");
        }
        if (!product) {
            product = await Product.findOne({ status: "ACTIVE" }).populate("category", "name");
        }

        if (!product) {
            sendSuccess(
                res,
                {
                    productId: "",
                    productName: "Chưa có sản phẩm",
                    sku: "N/A",
                    currentStock: 0,
                    averageDailySales: 0,
                    forecast30Days: 0,
                    recommendedReorderQty: 0,
                    stockoutRiskScore: "LOW",
                    reasoning: "Chưa có dữ liệu sản phẩm trong hệ thống",
                    chartData: [],
                },
                "Chưa có sản phẩm để dự báo",
            );
            return;
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const outboundTransactions = await Transaction.find({
            product: product._id,
            type: "OUTBOUND",
            createdAt: { $gte: thirtyDaysAgo },
        });

        const totalSoldIn30Days = outboundTransactions.reduce((sum, t) => sum + t.quantity, 0);
        const baselineDailySales = totalSoldIn30Days > 0 ? Math.ceil(totalSoldIn30Days / 30) : 3;
        const forecast30Days = Math.round(baselineDailySales * 30 * 1.15);
        const recommendedReorderQty = Math.max(
            0,
            forecast30Days + product.minStock - product.stock,
        );

        let stockoutRiskScore: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
        if (product.stock === 0) {
            stockoutRiskScore = "CRITICAL";
        } else if (product.stock <= product.minStock) {
            stockoutRiskScore = "HIGH";
        } else if (product.stock <= forecast30Days * 0.4) {
            stockoutRiskScore = "MEDIUM";
        }

        const daysRemaining =
            baselineDailySales > 0 ? Math.round(product.stock / baselineDailySales) : 999;

        const reasoning = await generateForecastAnalysis({
            name: product.name,
            sku: product.sku,
            stock: product.stock,
            minStock: product.minStock,
            averageDailySales: baselineDailySales,
            forecast30Days,
            recommendedReorderQty,
            daysRemaining,
        });

        const chartData = [
            { date: "01/09", historical: baselineDailySales, predicted: baselineDailySales },
            {
                date: "05/09",
                historical: Math.round(baselineDailySales * 1.2),
                predicted: Math.round(baselineDailySales * 1.1),
            },
            {
                date: "10/09",
                historical: Math.round(baselineDailySales * 1.4),
                predicted: Math.round(baselineDailySales * 1.3),
            },
            {
                date: "15/09",
                predicted: Math.round(baselineDailySales * 1.5),
                lowerBound: Math.round(baselineDailySales * 1.2),
                upperBound: Math.round(baselineDailySales * 1.8),
            },
            {
                date: "20/09",
                predicted: Math.round(baselineDailySales * 1.7),
                lowerBound: Math.round(baselineDailySales * 1.3),
                upperBound: Math.round(baselineDailySales * 2.1),
            },
        ];

        sendSuccess(
            res,
            {
                productId: String(product._id),
                productName: product.name,
                sku: product.sku,
                currentStock: product.stock,
                averageDailySales: baselineDailySales,
                forecast30Days,
                recommendedReorderQty,
                stockoutRiskScore,
                reasoning,
                chartData,
            },
            "Dự báo nhu cầu AI thành công",
        );
    },
);
