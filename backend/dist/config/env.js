"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    MONGODB_URI: zod_1.z.string().default("mongodb://localhost:27017/inventohub"),
    CORS_ORIGIN: zod_1.z.string().default("http://localhost:5173"),
    JWT_SECRET: zod_1.z.string().default("7f4c9a2e6d8b1f305c7e9a4d2f6b8c1e5a7d3f9b2c6e8a1d4f7b0c3e6a9d2"),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().default(""),
    CLOUDINARY_API_KEY: zod_1.z.string().default(""),
    CLOUDINARY_API_SECRET: zod_1.z.string().default(""),
    GEMINI_API_KEY: zod_1.z.string().default(""),
    GEMINI_MODEL: zod_1.z.string().default("gemini-3.6-flash"),
    VNPAY_TMN_CODE: zod_1.z.string().default("CGXZLS0Z"),
    VNPAY_HASH_SECRET: zod_1.z.string().default("XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN"),
    VNPAY_URL: zod_1.z.string().default("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"),
    VNPAY_RETURN_URL: zod_1.z.string().default("http://localhost:5173/store/payment/vnpay-return"),
});
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error("Lỗi cấu hình biến môi trường:", parsedEnv.error.format());
    process.exit(1);
}
exports.env = parsedEnv.data;
