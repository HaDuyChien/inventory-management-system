"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const env_1 = require("../config/env");
const errorHandler = (err, _req, res, _next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Đã xảy ra lỗi máy chủ nội bộ";
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Định dạng mã nhận diện không hợp lệ: ${err.value}`;
    }
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {}).join(", ");
        message = `Giá trị của trường ${field} đã tồn tại trong hệ thống`;
    }
    if (err.name === "ValidationError" && err.errors) {
        statusCode = 400;
        const messages = Object.values(err.errors).map((e) => e.message);
        message = `Dữ liệu không hợp lệ: ${messages.join(", ")}`;
    }
    if (err.name === "ZodError") {
        statusCode = 400;
        message = "Lỗi xác thực định dạng dữ liệu đầu vào";
    }
    console.error(`Lỗi hệ thống: [${statusCode}] ${message}`);
    res.status(statusCode).json({
        thanhCong: false,
        thongDiep: message,
        ...(env_1.env.NODE_ENV === "development" && { chiTietLoi: err.stack }),
    });
};
exports.errorHandler = errorHandler;
