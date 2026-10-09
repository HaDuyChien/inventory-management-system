import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGODB_URI: z.string().default("mongodb://localhost:27017/inventohub"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    JWT_SECRET: z.string().default("7f4c9a2e6d8b1f305c7e9a4d2f6b8c1e5a7d3f9b2c6e8a1d4f7b0c3e6a9d2"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    CLOUDINARY_CLOUD_NAME: z.string().default(""),
    CLOUDINARY_API_KEY: z.string().default(""),
    CLOUDINARY_API_SECRET: z.string().default(""),
    GEMINI_API_KEY: z.string().default(""),
    GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
    VNPAY_TMN_CODE: z.string().default("CGXZLS0Z"),
    VNPAY_HASH_SECRET: z.string().default("XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN"),
    VNPAY_URL: z.string().default("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"),
    VNPAY_RETURN_URL: z.string().default("http://localhost:5173/store/payment/vnpay-return"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Lỗi cấu hình biến môi trường:", parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;
