"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImage = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const productSchema = zod_1.z.object({
    sku: zod_1.z.string().min(2, "Mã SKU phải có tối thiểu 2 ký tự"),
    name: zod_1.z.string().min(2, "Tên sản phẩm phải có tối thiểu 2 ký tự"),
    category: zod_1.z.string().min(1, "Danh mục sản phẩm là bắt buộc"),
    price: zod_1.z.coerce.number().min(0, "Giá bán không được nhỏ hơn 0"),
    costPrice: zod_1.z.coerce.number().min(0, "Giá vốn không được nhỏ hơn 0").default(0),
    stock: zod_1.z.coerce.number().min(0, "Tồn kho không được âm").default(0),
    minStock: zod_1.z.coerce.number().min(0, "Ngưỡng tồn không được âm").default(5),
    unit: zod_1.z.string().default("Cái"),
    thumbnail: zod_1.z.string().optional(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
    barcode: zod_1.z.string().optional(),
    weight: zod_1.z.coerce.number().optional(),
});
exports.getProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
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
        const priceFilter = {};
        if (req.query.minPrice)
            priceFilter.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice)
            priceFilter.$lte = Number(req.query.maxPrice);
        filter.price = priceFilter;
    }
    const [products, total] = await Promise.all([
        Product_1.Product.find(filter)
            .populate("category", "name slug")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Product_1.Product.countDocuments(filter),
    ]);
    (0, response_1.sendSuccess)(res, {
        danhSach: products,
        phanTrang: {
            trangHienTai: page,
            tongSoTrang: Math.ceil(total / limit),
            tongSoBanGhi: total,
            kichThuocTrang: limit,
        },
    }, "Lấy danh sách sản phẩm thành công");
});
exports.getProductById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const product = await Product_1.Product.findById(req.params.id).populate("category", "name slug");
    if (!product) {
        return next(new AppError_1.AppError("Không tìm thấy sản phẩm yêu cầu", 404));
    }
    (0, response_1.sendSuccess)(res, product, "Lấy thông tin chi tiết sản phẩm thành công");
});
exports.createProduct = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validated = productSchema.parse(req.body);
    let categoryExists = null;
    if (mongoose_1.default.Types.ObjectId.isValid(validated.category)) {
        categoryExists = await Category_1.Category.findById(validated.category);
    }
    if (!categoryExists) {
        categoryExists = await Category_1.Category.findOne({
            $or: [
                { name: validated.category },
                { slug: validated.category },
            ],
        });
    }
    if (!categoryExists) {
        categoryExists = await Category_1.Category.findOne();
    }
    if (!categoryExists) {
        return next(new AppError_1.AppError("Danh mục chỉ định không tồn tại", 400));
    }
    const existingSku = await Product_1.Product.findOne({ sku: validated.sku.toUpperCase() });
    if (existingSku) {
        return next(new AppError_1.AppError(`Mã SKU ${validated.sku} đã tồn tại trong hệ thống`, 400));
    }
    let thumbnail = validated.thumbnail || "";
    const images = validated.images || [];
    if (req.file) {
        const uploaded = await (0, cloudinaryUpload_1.uploadBufferToCloudinary)(req.file.buffer, "inventohub/products");
        thumbnail = uploaded.url;
        images.unshift(uploaded.url);
    }
    const product = await Product_1.Product.create({
        ...validated,
        category: categoryExists._id,
        sku: validated.sku.toUpperCase(),
        thumbnail: thumbnail || images[0] || "",
        images,
    });
    const populated = await Product_1.Product.findById(product._id).populate("category", "name slug");
    (0, response_1.sendSuccess)(res, populated, "Thêm mới sản phẩm thành công", 201);
});
exports.updateProduct = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validated = productSchema.partial().parse(req.body);
    const product = await Product_1.Product.findById(req.params.id);
    if (!product) {
        return next(new AppError_1.AppError("Không tìm thấy sản phẩm để cập nhật", 404));
    }
    if (validated.sku && validated.sku.toUpperCase() !== product.sku) {
        const existingSku = await Product_1.Product.findOne({ sku: validated.sku.toUpperCase() });
        if (existingSku) {
            return next(new AppError_1.AppError(`Mã SKU ${validated.sku} đã được sử dụng`, 400));
        }
        product.sku = validated.sku.toUpperCase();
    }
    if (validated.category) {
        let categoryExists = null;
        if (mongoose_1.default.Types.ObjectId.isValid(validated.category)) {
            categoryExists = await Category_1.Category.findById(validated.category);
        }
        if (!categoryExists) {
            categoryExists = await Category_1.Category.findOne({
                $or: [
                    { name: validated.category },
                    { slug: validated.category },
                ],
            });
        }
        if (!categoryExists) {
            return next(new AppError_1.AppError("Danh mục chỉ định không tồn tại", 400));
        }
        product.category = categoryExists._id;
    }
    if (req.file) {
        const uploaded = await (0, cloudinaryUpload_1.uploadBufferToCloudinary)(req.file.buffer, "inventohub/products");
        product.thumbnail = uploaded.url;
        product.images.unshift(uploaded.url);
    }
    else if (validated.thumbnail) {
        product.thumbnail = validated.thumbnail;
    }
    if (validated.name !== undefined)
        product.name = validated.name;
    if (validated.price !== undefined)
        product.price = validated.price;
    if (validated.costPrice !== undefined)
        product.costPrice = validated.costPrice;
    if (validated.stock !== undefined)
        product.stock = validated.stock;
    if (validated.minStock !== undefined)
        product.minStock = validated.minStock;
    if (validated.unit !== undefined)
        product.unit = validated.unit;
    if (validated.description !== undefined)
        product.description = validated.description;
    if (validated.status !== undefined)
        product.status = validated.status;
    if (validated.barcode !== undefined)
        product.barcode = validated.barcode;
    if (validated.weight !== undefined)
        product.weight = validated.weight;
    if (validated.images)
        product.images = validated.images;
    await product.save();
    const updated = await Product_1.Product.findById(product._id).populate("category", "name slug");
    (0, response_1.sendSuccess)(res, updated, "Cập nhật sản phẩm thành công");
});
exports.deleteProduct = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const product = await Product_1.Product.findById(req.params.id);
    if (!product) {
        return next(new AppError_1.AppError("Không tìm thấy sản phẩm để xóa", 404));
    }
    await Product_1.Product.findByIdAndDelete(req.params.id);
    (0, response_1.sendSuccess)(res, null, "Xóa sản phẩm thành công");
});
exports.uploadProductImage = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError_1.AppError("Vui lòng chọn tệp hình ảnh để tải lên", 400));
    }
    const uploaded = await (0, cloudinaryUpload_1.uploadBufferToCloudinary)(req.file.buffer, "inventohub/products");
    (0, response_1.sendSuccess)(res, {
        url: uploaded.url,
        publicId: uploaded.publicId,
    }, "Tải hình ảnh lên Cloudinary thành công");
});
