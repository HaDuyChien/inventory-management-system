"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameChatSession = exports.deleteChatSession = exports.sendMessageToSession = exports.createChatSession = exports.getChatSessionById = exports.getChatSessions = exports.generateDescriptionAI = exports.getReorderAdviceAI = exports.getWarehouseSnapshotAI = exports.askAI = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../middleware/asyncHandler");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const AIChatSession_1 = require("../models/AIChatSession");
const geminiService_1 = require("../services/geminiService");
const aiContextService_1 = require("../services/aiContextService");
const askSchema = zod_1.z.object({
    question: zod_1.z
        .string()
        .min(2, "Vui lòng nhập câu hỏi tối thiểu 2 ký tự")
        .max(500, "Câu hỏi tối đa 500 ký tự"),
    contextSummary: zod_1.z.string().max(2000, "Tóm tắt ngữ cảnh tối đa 2000 ký tự").optional(),
});
const generateDescSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, "Tên sản phẩm là bắt buộc")
        .max(200, "Tên sản phẩm tối đa 200 ký tự"),
    category: zod_1.z.string().max(100, "Tên danh mục tối đa 100 ký tự").optional(),
    brand: zod_1.z.string().max(100, "Tên thương hiệu tối đa 100 ký tự").optional(),
});
const renameSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Tiêu đề không được để trống").max(100, "Tiêu đề tối đa 100 ký tự"),
});
exports.askAI = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const validated = askSchema.parse(req.body);
    const result = await (0, geminiService_1.askInventoryAssistant)(validated.question, validated.contextSummary);
    (0, response_1.sendSuccess)(res, result, "Tạo câu trả lời từ AI thành công");
});
exports.getWarehouseSnapshotAI = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await (0, aiContextService_1.getWarehouseContextSnapshot)();
    (0, response_1.sendSuccess)(res, data.snapshot, "Lấy thông tin tổng quan kho thành công");
});
exports.getReorderAdviceAI = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const advice = await (0, aiContextService_1.getReorderAdviceList)();
    (0, response_1.sendSuccess)(res, advice, "Lấy danh sách đề xuất đặt hàng thành công");
});
exports.generateDescriptionAI = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const validated = generateDescSchema.parse(req.body);
    const description = await (0, geminiService_1.generateProductDescription)(validated);
    (0, response_1.sendSuccess)(res, { description }, "Sinh mô tả từ AI thành công");
});
exports.getChatSessions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const sessions = await AIChatSession_1.AIChatSession.find({ user: userId })
        .select("_id title createdAt updatedAt messages")
        .sort({ updatedAt: -1 });
    const summaries = sessions.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastMessage: s.messages[s.messages.length - 1]?.text || "",
    }));
    (0, response_1.sendSuccess)(res, summaries, "Lấy danh sách phiên chat thành công");
});
exports.getChatSessionById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?._id;
    const session = await AIChatSession_1.AIChatSession.findOne({
        _id: req.params.id,
        user: userId,
    });
    if (!session) {
        return next(new AppError_1.AppError("Không tìm thấy phiên chat", 404));
    }
    (0, response_1.sendSuccess)(res, {
        id: session._id.toString(),
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
    }, "Lấy chi tiết phiên chat thành công");
});
exports.createChatSession = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const title = req.body.title?.trim() || "Đoạn chat mới";
    const newSession = await AIChatSession_1.AIChatSession.create({
        user: userId,
        title,
        messages: [],
    });
    (0, response_1.sendSuccess)(res, {
        id: newSession._id.toString(),
        title: newSession.title,
        messages: newSession.messages,
        createdAt: newSession.createdAt,
        updatedAt: newSession.updatedAt,
    }, "Khởi tạo phiên chat thành công");
});
exports.sendMessageToSession = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?._id;
    const sessionId = req.params.id;
    const validated = askSchema.parse(req.body);
    let session = null;
    if (sessionId && sessionId !== "new") {
        session = await AIChatSession_1.AIChatSession.findOne({ _id: sessionId, user: userId });
    }
    if (!session) {
        session = await AIChatSession_1.AIChatSession.create({
            user: userId,
            title: "Đoạn chat mới",
            messages: [],
        });
    }
    const isFirstQuestion = session.messages.length === 0 || session.title === "Đoạn chat mới";
    const nowVN = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const userMsg = {
        id: `usr-${Date.now()}`,
        sender: "user",
        text: validated.question,
        timestamp: nowVN,
    };
    const result = await (0, geminiService_1.askInventoryAssistant)(validated.question, validated.contextSummary);
    const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: result.reply,
        timestamp: nowVN,
        suggestions: result.suggestions,
    };
    session.messages.push(userMsg, aiMsg);
    if (isFirstQuestion) {
        try {
            const autoTitle = await (0, geminiService_1.generateChatTitle)(validated.question);
            if (autoTitle && autoTitle.trim().length > 0) {
                session.title = autoTitle.trim();
            }
        }
        catch (err) {
            console.error("Lỗi tự động tạo tiêu đề:", err);
        }
    }
    await session.save();
    (0, response_1.sendSuccess)(res, {
        sessionId: session._id.toString(),
        title: session.title,
        messages: session.messages,
        reply: result.reply,
        suggestions: result.suggestions,
    }, "Gửi tin nhắn vào phiên chat thành công");
});
exports.deleteChatSession = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?._id;
    const session = await AIChatSession_1.AIChatSession.findOneAndDelete({
        _id: req.params.id,
        user: userId,
    });
    if (!session) {
        return next(new AppError_1.AppError("Không tìm thấy phiên chat để xóa", 404));
    }
    (0, response_1.sendSuccess)(res, null, "Xóa phiên chat thành công");
});
exports.renameChatSession = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?._id;
    const validated = renameSchema.parse(req.body);
    const session = await AIChatSession_1.AIChatSession.findOneAndUpdate({ _id: req.params.id, user: userId }, { title: validated.title }, { new: true });
    if (!session) {
        return next(new AppError_1.AppError("Không tìm thấy phiên chat để đổi tên", 404));
    }
    (0, response_1.sendSuccess)(res, { id: session._id.toString(), title: session.title }, "Cập nhật tiêu đề phiên chat thành công");
});
