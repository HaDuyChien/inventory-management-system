import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

const startServer = async (): Promise<void> => {
    await connectDB();

    const server = app.listen(env.PORT, () => {
        console.log(`Máy chủ InventoHub đang hoạt động tại cổng ${env.PORT}`);
        console.log(`Môi trường hoạt động: ${env.NODE_ENV}`);
        console.log(`Kiểm tra trạng thái hệ thống tại: http://localhost:${env.PORT}/api/health`);
    });

    const handleShutdown = (signal: string) => {
        console.log(`Nhận tín hiệu ${signal}. Đang tiến hành đóng máy chủ an toàn...`);
        server.close(() => {
            console.log("Đã đóng toàn bộ kết nối và tắt máy chủ an toàn");
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));

    process.on("unhandledRejection", (reason: unknown) => {
        console.error("Lỗi unhandledRejection chưa được xử lý:", reason);
        server.close(() => {
            process.exit(1);
        });
    });

    process.on("uncaughtException", (error: Error) => {
        console.error("Lỗi uncaughtException nghiêm trọng:", error.message);
        process.exit(1);
    });
};

startServer();
