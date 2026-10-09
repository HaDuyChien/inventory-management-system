"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadBufferToCloudinary = void 0;
const cloudinary_1 = __importStar(require("../config/cloudinary"));
const env_1 = require("../config/env");
const AppError_1 = require("./AppError");
const uploadBufferToCloudinary = (buffer, folder = "inventohub/products") => {
    return new Promise((resolve, reject) => {
        if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
            if (env_1.env.CLOUDINARY_API_KEY &&
                env_1.env.CLOUDINARY_API_SECRET &&
                env_1.env.CLOUDINARY_API_KEY === env_1.env.CLOUDINARY_API_SECRET) {
                return reject(new AppError_1.AppError("Mã CLOUDINARY_API_SECRET trong tệp backend/.env đang bị đặt trùng với CLOUDINARY_API_KEY. Vui lòng mở bảng điều khiển Cloudinary và sao chép đúng chuỗi API Secret.", 400));
            }
            return reject(new AppError_1.AppError("Dịch vụ Cloudinary chưa được cấu hình đầy đủ trong biến môi trường", 500));
        }
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder,
            resource_type: "image",
        }, (error, result) => {
            if (error || !result) {
                return reject(new AppError_1.AppError(`Lỗi khi tải ảnh lên dịch vụ Cloudinary: ${error?.message || "Không xác định"}`, 500));
            }
            resolve({
                url: result.secure_url,
                publicId: result.public_id,
            });
        });
        uploadStream.end(buffer);
    });
};
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    if (!(0, cloudinary_1.isCloudinaryConfigured)())
        return;
    try {
        await cloudinary_1.default.uploader.destroy(publicId);
    }
    catch (error) {
        console.error(`Lỗi khi xóa tệp ảnh trên Cloudinary: ${publicId}`, error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
