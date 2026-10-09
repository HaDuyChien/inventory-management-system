"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        console.log(`Kết nối cơ sở dữ liệu MongoDB thành công: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Lỗi kết nối cơ sở dữ liệu MongoDB: ${error.message}`);
        }
        else {
            console.error("Lỗi kết nối cơ sở dữ liệu MongoDB không xác định");
        }
        process.exit(1);
    }
};
exports.connectDB = connectDB;
mongoose_1.default.connection.on("disconnected", () => {
    console.warn("Cơ sở dữ liệu MongoDB đã bị ngắt kết nối");
});
mongoose_1.default.connection.on("error", (err) => {
    console.error(`Lỗi phát sinh từ MongoDB: ${err.message}`);
});
