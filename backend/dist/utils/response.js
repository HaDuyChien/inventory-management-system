"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200) => {
    const body = {
        thanhCong: true,
        thongDiep: message,
        duLieu: data,
    };
    return res.status(statusCode).json(body);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500, details) => {
    const body = {
        thanhCong: false,
        thongDiep: message,
        chiTiet: details,
    };
    return res.status(statusCode).json(body);
};
exports.sendError = sendError;
