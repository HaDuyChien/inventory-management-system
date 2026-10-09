import { UploadApiResponse } from "cloudinary";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary";
import { env } from "../config/env";
import { AppError } from "./AppError";

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
}

export const uploadBufferToCloudinary = (
    buffer: Buffer,
    folder = "inventohub/products",
): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
        if (!isCloudinaryConfigured()) {
            if (
                env.CLOUDINARY_API_KEY &&
                env.CLOUDINARY_API_SECRET &&
                env.CLOUDINARY_API_KEY === env.CLOUDINARY_API_SECRET
            ) {
                return reject(
                    new AppError(
                        "Mã CLOUDINARY_API_SECRET trong tệp backend/.env đang bị đặt trùng với CLOUDINARY_API_KEY. Vui lòng mở bảng điều khiển Cloudinary và sao chép đúng chuỗi API Secret.",
                        400,
                    ),
                );
            }
            return reject(
                new AppError(
                    "Dịch vụ Cloudinary chưa được cấu hình đầy đủ trong biến môi trường",
                    500,
                ),
            );
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
            },
            (error, result: UploadApiResponse | undefined) => {
                if (error || !result) {
                    return reject(
                        new AppError(
                            `Lỗi khi tải ảnh lên dịch vụ Cloudinary: ${error?.message || "Không xác định"}`,
                            500,
                        ),
                    );
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            },
        );

        uploadStream.end(buffer);
    });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    if (!isCloudinaryConfigured()) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Lỗi khi xóa tệp ảnh trên Cloudinary: ${publicId}`, error);
    }
};
