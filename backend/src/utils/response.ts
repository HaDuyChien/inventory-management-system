import { Response } from "express";

interface SuccessResponse<T> {
    thanhCong: true;
    thongDiep?: string;
    duLieu: T;
}

interface ErrorResponse {
    thanhCong: false;
    thongDiep: string;
    chiTiet?: unknown;
}

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
): Response => {
    const body: SuccessResponse<T> = {
        thanhCong: true,
        thongDiep: message,
        duLieu: data,
    };
    return res.status(statusCode).json(body);
};

export const sendError = (
    res: Response,
    message: string,
    statusCode = 500,
    details?: unknown,
): Response => {
    const body: ErrorResponse = {
        thanhCong: false,
        thongDiep: message,
        chiTiet: details,
    };
    return res.status(statusCode).json(body);
};
