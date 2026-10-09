import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload";

const productSchema = z.object({
    sku: z.string().min(2, "Mã SKU phải có tối thiểu 2 ký tự"),
    name: z.string().min(2, "Tên sản phẩm phải có tối thiểu 2 ký tự"),
    category: z.string().min(1, "Danh mục sản phẩm là bắt buộc"),
    price: z.coerce.number().min(0, "Giá bán không được nhỏ hơn 0"),
    costPrice: z.coerce.number().min(0, "Giá vốn không được nhỏ hơn 0").default(0),
    stock: z.coerce.number().min(0, "Tồn kho không được âm").default(0),
    minStock: z.coerce.number().min(0, "Ngưỡng tồn không được âm").default(5),
    unit: z.string().default("Cái"),
    thumbnail: z.string().optional(),
    images: z.array(z.string()).optional(),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
    barcode: z.string().optional(),
    weight: z.coerce.number().optional(),
});

export const getProducts = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};

        if (req.query.search) {
            const keyword = String(req.query.search).trim();
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { sku: { $regex: keyword, $options: "i" } },
                { barcode: { $regex: keyword, $options: "i" } },
            ];
        }

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.lowStock === "true") {
            filter.$expr = { $lte: ["$stock", "$minStock"] };
        }

        if (req.query.minPrice || req.query.maxPrice) {
            const priceFilter: Record<string, number> = {};
            if (req.query.minPrice) priceFilter.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) priceFilter.$lte = Number(req.query.maxPrice);
            filter.price = priceFilter;
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("category", "name slug")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Product.countDocuments(filter),
        ]);

        sendSuccess(
            res,
            {
                danhSach: products,
                phanTrang: {
                    trangHienTai: page,
                    tongSoTrang: Math.ceil(total / limit),
                    tongSoBanGhi: total,
                    kichThuocTrang: limit,
                },
            },
            "Lấy danh sách sản phẩm thành công",
        );
    },
);

export const getProductById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const product = await Product.findById(req.params.id).populate("category", "name slug");
        if (!product) {
            return next(new AppError("Không tìm thấy sản phẩm yêu cầu", 404));
        }

        sendSuccess(res, product, "Lấy thông tin chi tiết sản phẩm thành công");
    },
);

export const createProduct = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const validated = productSchema.parse(req.body);

        let categoryExists = null;
        if (mongoose.Types.ObjectId.isValid(validated.category)) {
            categoryExists = await Category.findById(validated.category);
        }
        if (!categoryExists) {
            categoryExists = await Category.findOne({
                $or: [
                    { name: validated.category },
                    { slug: validated.category },
                ],
            });
        }
        if (!categoryExists) {
            categoryExists = await Category.findOne();
        }
        if (!categoryExists) {
            return next(new AppError("Danh mục chỉ định không tồn tại", 400));
        }

        const existingSku = await Product.findOne({ sku: validated.sku.toUpperCase() });
        if (existingSku) {
            return next(new AppError(`Mã SKU ${validated.sku} đã tồn tại trong hệ thống`, 400));
        }

        let thumbnail = validated.thumbnail || "";
        const images: string[] = validated.images || [];

        if (req.file) {
            const uploaded = await uploadBufferToCloudinary(req.file.buffer, "inventohub/products");
            thumbnail = uploaded.url;
            images.unshift(uploaded.url);
        }

        const product = await Product.create({
            ...validated,
            category: categoryExists._id,
            sku: validated.sku.toUpperCase(),
            thumbnail: thumbnail || images[0] || "",
            images,
        });

        const populated = await Product.findById(product._id).populate("category", "name slug");
        sendSuccess(res, populated, "Thêm mới sản phẩm thành công", 201);
    },
);

export const updateProduct = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const validated = productSchema.partial().parse(req.body);

        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new AppError("Không tìm thấy sản phẩm để cập nhật", 404));
        }

        if (validated.sku && validated.sku.toUpperCase() !== product.sku) {
            const existingSku = await Product.findOne({ sku: validated.sku.toUpperCase() });
            if (existingSku) {
                return next(new AppError(`Mã SKU ${validated.sku} đã được sử dụng`, 400));
            }
            product.sku = validated.sku.toUpperCase();
        }

        if (validated.category) {
            let categoryExists = null;
            if (mongoose.Types.ObjectId.isValid(validated.category)) {
                categoryExists = await Category.findById(validated.category);
            }
            if (!categoryExists) {
                categoryExists = await Category.findOne({
                    $or: [
                        { name: validated.category },
                        { slug: validated.category },
                    ],
                });
            }
            if (!categoryExists) {
                return next(new AppError("Danh mục chỉ định không tồn tại", 400));
            }
            product.category = categoryExists._id as any;
        }

        if (req.file) {
            const uploaded = await uploadBufferToCloudinary(req.file.buffer, "inventohub/products");
            product.thumbnail = uploaded.url;
            product.images.unshift(uploaded.url);
        } else if (validated.thumbnail) {
            product.thumbnail = validated.thumbnail;
        }

        if (validated.name !== undefined) product.name = validated.name;
        if (validated.price !== undefined) product.price = validated.price;
        if (validated.costPrice !== undefined) product.costPrice = validated.costPrice;
        if (validated.stock !== undefined) product.stock = validated.stock;
        if (validated.minStock !== undefined) product.minStock = validated.minStock;
        if (validated.unit !== undefined) product.unit = validated.unit;
        if (validated.description !== undefined) product.description = validated.description;
        if (validated.status !== undefined) product.status = validated.status;
        if (validated.barcode !== undefined) product.barcode = validated.barcode;
        if (validated.weight !== undefined) product.weight = validated.weight;
        if (validated.images) product.images = validated.images;

        await product.save();
        const updated = await Product.findById(product._id).populate("category", "name slug");
        sendSuccess(res, updated, "Cập nhật sản phẩm thành công");
    },
);

export const deleteProduct = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new AppError("Không tìm thấy sản phẩm để xóa", 404));
        }

        await Product.findByIdAndDelete(req.params.id);
        sendSuccess(res, null, "Xóa sản phẩm thành công");
    },
);

export const uploadProductImage = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.file) {
            return next(new AppError("Vui lòng chọn tệp hình ảnh để tải lên", 400));
        }

        const uploaded = await uploadBufferToCloudinary(req.file.buffer, "inventohub/products");
        sendSuccess(
            res,
            {
                url: uploaded.url,
                publicId: uploaded.publicId,
            },
            "Tải hình ảnh lên Cloudinary thành công",
        );
    },
);
