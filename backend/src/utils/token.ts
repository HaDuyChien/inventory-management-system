import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./AppError";

export interface TokenPayload {
    id: string;
    role?: string;
    type: "admin" | "customer";
}

export const signToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
};

export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
        throw new AppError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn", 401);
    }
};
