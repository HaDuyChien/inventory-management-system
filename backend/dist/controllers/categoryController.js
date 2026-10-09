"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getCategories = void 0;
const zod_1 = require("zod");
const Category_1 = require("../models/Category");
const Product_1 = require("../models/Product");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Tên danh mục phải có tối thiểu 2 ký tự"),
    slug: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
};
exports.getCategories = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const categories = await Category_1.Category.find().sort({ createdAt: -1 });
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
        const count = await Product_1.Product.countDocuments({ category: cat._id });
        return {
            ...cat.toObject(),
            productCount: count,
        };
    }));
    (0, response_1.sendSuccess)(res, categoriesWithCount, "Lấy danh sách danh mục thành công");
});
exports.getCategoryById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const category = await Category_1.Category.findById(req.params.id);
    if (!category) {
        return next(new AppError_1.AppError("Không tìm thấy danh mục yêu cầu", 404));
    }
    const count = await Product_1.Product.countDocuments({ category: category._id });
    (0, response_1.sendSuccess)(res, { ...category.toObject(), productCount: count }, "Lấy thông tin danh mục thành công");
});
exports.createCategory = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validated = categorySchema.parse(req.body);
    let imageUrl = validated.image || "";
    if (req.file) {
        const uploaded = await (0, cloudinaryUpload_1.uploadBufferToCloudinary)(req.file.buffer, "inventohub/categories");
        imageUrl = uploaded.url;
    }
    const slug = validated.slug || generateSlug(validated.name);
    const existing = await Category_1.Category.findOne({ $or: [{ name: validated.name }, { slug }] });
    if (existing) {
        return next(new AppError_1.AppError("Tên danh mục hoặc mã đường dẫn đã tồn tại", 400));
    }
    const category = await Category_1.Category.create({
        ...validated,
        slug,
        image: imageUrl,
    });
    (0, response_1.sendSuccess)(res, category, "Tạo danh mục mới thành công", 201);
});
exports.updateCategory = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validated = categorySchema.partial().parse(req.body);
    const category = await Category_1.Category.findById(req.params.id);
    if (!category) {
        return next(new AppError_1.AppError("Không tìm thấy danh mục để cập nhật", 404));
    }
    let imageUrl = category.image;
    if (req.file) {
        const uploaded = await (0, cloudinaryUpload_1.uploadBufferToCloudinary)(req.file.buffer, "inventohub/categories");
        imageUrl = uploaded.url;
    }
    else if (validated.image !== undefined) {
        imageUrl = validated.image;
    }
    if (validated.name && validated.name !== category.name) {
        const slug = validated.slug || generateSlug(validated.name);
        category.name = validated.name;
        category.slug = slug;
    }
    if (validated.description !== undefined)
        category.description = validated.description;
    if (validated.status !== undefined)
        category.status = validated.status;
    category.image = imageUrl;
    await category.save();
    (0, response_1.sendSuccess)(res, category, "Cập nhật thông tin danh mục thành công");
});
exports.deleteCategory = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const category = await Category_1.Category.findById(req.params.id);
    if (!category) {
        return next(new AppError_1.AppError("Không tìm thấy danh mục để xóa", 404));
    }
    const productCount = await Product_1.Product.countDocuments({ category: category._id });
    if (productCount > 0) {
        return next(new AppError_1.AppError(`Không thể xóa danh mục này vì đang có ${productCount} sản phẩm liên kết`, 400));
    }
    await Category_1.Category.findByIdAndDelete(req.params.id);
    (0, response_1.sendSuccess)(res, null, "Xóa danh mục thành công");
});
