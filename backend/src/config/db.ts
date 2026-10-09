import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI);
        console.log(`Kết nối cơ sở dữ liệu MongoDB thành công: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Lỗi kết nối cơ sở dữ liệu MongoDB: ${error.message}`);
        } else {
            console.error("Lỗi kết nối cơ sở dữ liệu MongoDB không xác định");
        }
        process.exit(1);
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn("Cơ sở dữ liệu MongoDB đã bị ngắt kết nối");
});

mongoose.connection.on("error", (err) => {
    console.error(`Lỗi phát sinh từ MongoDB: ${err.message}`);
});
