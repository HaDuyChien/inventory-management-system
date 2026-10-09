import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { AppError } from "./utils/AppError";

import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import warehouseRoutes from "./routes/warehouseRoutes";
import supplierRoutes from "./routes/supplierRoutes";
import orderRoutes from "./routes/orderRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import auditLogRoutes from "./routes/auditLogRoutes";
import reportRoutes from "./routes/reportRoutes";
import aiRoutes from "./routes/aiRoutes";
import userRoutes from "./routes/userRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import customerRoutes from "./routes/customerRoutes";
import returnRoutes from "./routes/returnRoutes";

const app: Application = express();

app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        messages: "Hệ thống backend InventoHub đang hoạt động ổn định",
        time: new Date().toISOString(),
        environment: env.NODE_ENV,
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/returns", returnRoutes);

app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Đường dẫn yêu cầu không tồn tại trên máy chủ: ${req.originalUrl}`, 404));
});

app.use(errorHandler);

export default app;
