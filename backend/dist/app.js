"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const AppError_1 = require("./utils/AppError");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const warehouseRoutes_1 = __importDefault(require("./routes/warehouseRoutes"));
const supplierRoutes_1 = __importDefault(require("./routes/supplierRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const auditLogRoutes_1 = __importDefault(require("./routes/auditLogRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const returnRoutes_1 = __importDefault(require("./routes/returnRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        messages: "Hệ thống backend InventoHub đang hoạt động ổn định",
        time: new Date().toISOString(),
        environment: env_1.env.NODE_ENV,
    });
});
app.use("/api/auth", authRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/products", productRoutes_1.default);
app.use("/api/warehouses", warehouseRoutes_1.default);
app.use("/api/suppliers", supplierRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/transactions", transactionRoutes_1.default);
app.use("/api/audit-logs", auditLogRoutes_1.default);
app.use("/api/reports", reportRoutes_1.default);
app.use("/api/ai", aiRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/payment", paymentRoutes_1.default);
app.use("/api/customers", customerRoutes_1.default);
app.use("/api/returns", returnRoutes_1.default);
app.use((req, _res, next) => {
    next(new AppError_1.AppError(`Đường dẫn yêu cầu không tồn tại trên máy chủ: ${req.originalUrl}`, 404));
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
