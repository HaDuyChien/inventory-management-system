"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const startServer = async () => {
    await (0, db_1.connectDB)();
    const server = app_1.default.listen(env_1.env.PORT, () => {
        console.log(`Máy chủ InventoHub đang hoạt động tại cổng ${env_1.env.PORT}`);
        console.log(`Môi trường hoạt động: ${env_1.env.NODE_ENV}`);
        console.log(`Kiểm tra trạng thái hệ thống tại: http://localhost:${env_1.env.PORT}/api/health`);
    });
    const handleShutdown = (signal) => {
        console.log(`Nhận tín hiệu ${signal}. Đang tiến hành đóng máy chủ an toàn...`);
        server.close(() => {
            console.log("Đã đóng toàn bộ kết nối và tắt máy chủ an toàn");
            process.exit(0);
        });
    };
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("unhandledRejection", (reason) => {
        console.error("Lỗi unhandledRejection chưa được xử lý:", reason);
        server.close(() => {
            process.exit(1);
        });
    });
    process.on("uncaughtException", (error) => {
        console.error("Lỗi uncaughtException nghiêm trọng:", error.message);
        process.exit(1);
    });
};
startServer();
