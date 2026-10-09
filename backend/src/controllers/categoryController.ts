import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload";

const categorySchema = z.object({
    name: z.string().min(2, "Tên danh mục phải có tối thiểu 2 ký tự"),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
};

export const getCategories = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
        const categories = await Category.find().sort({ createdAt: -1 });

        const categoriesWithCount = await Promise.all(
            categories.map(async (cat) => {
                const count = await Product.countDocuments({ category: cat._id });
                return {
                    ...cat.toObject(),
                    productCount: count,
                };
            }),
        );

        sendSuccess(res, categoriesWithCount, "Lấy danh sách danh mục thành công");
    },
);

export const getCategoryById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return next(new AppError("Không tìm thấy danh mục yêu cầu", 404));
        }

        const count = await Product.countDocuments({ category: category._id });
        sendSuccess(
            res,
            { ...category.toObject(), productCount: count },
            "Lấy thông tin danh mục thành công",
        );
    },
);

export const createCategory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const validated = categorySchema.parse(req.body);

        let imageUrl = validated.image || "";
        if (req.file) {
            const uploaded = await uploadBufferToCloudinary(
                req.file.buffer,
                "inventohub/categories",
            );
            imageUrl = uploaded.url;
        }

        const slug = validated.slug || generateSlug(validated.name);
        const existing = await Category.findOne({ $or: [{ name: validated.name }, { slug }] });
        if (existing) {
            return next(new AppError("Tên danh mục hoặc mã đường dẫn đã tồn tại", 400));
        }

        const category = await Category.create({
            ...validated,
            slug,
            image: imageUrl,
        });

        sendSuccess(res, category, "Tạo danh mục mới thành công", 201);
    },
);

export const updateCategory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const validated = categorySchema.partial().parse(req.body);

        const category = await Category.findById(req.params.id);
        if (!category) {
            return next(new AppError("Không tìm thấy danh mục để cập nhật", 404));
        }

        let imageUrl = category.image;
        if (req.file) {
            const uploaded = await uploadBufferToCloudinary(
                req.file.buffer,
                "inventohub/categories",
            );
            imageUrl = uploaded.url;
        } else if (validated.image !== undefined) {
            imageUrl = validated.image;
        }

        if (validated.name && validated.name !== category.name) {
            const slug = validated.slug || generateSlug(validated.name);
            category.name = validated.name;
            category.slug = slug;
        }

        if (validated.description !== undefined) category.description = validated.description;
        if (validated.status !== undefined) category.status = validated.status;
        category.image = imageUrl;

        await category.save();
        sendSuccess(res, category, "Cập nhật thông tin danh mục thành công");
    },
);

export const deleteCategory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return next(new AppError("Không tìm thấy danh mục để xóa", 404));
        }

        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return next(
                new AppError(
                    `Không thể xóa danh mục này vì đang có ${productCount} sản phẩm liên kết`,
                    400,
                ),
            );
        }

        await Category.findByIdAndDelete(req.params.id);
        sendSuccess(res, null, "Xóa danh mục thành công");
    },
);
