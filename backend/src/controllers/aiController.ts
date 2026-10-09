import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendSuccess } from "../utils/response";
import { AppError } from "../utils/AppError";
import { AIChatSession, IAIChatMessage } from "../models/AIChatSession";
import {
    askInventoryAssistant,
    generateProductDescription,
    generateChatTitle,
} from "../services/geminiService";
import {
    getWarehouseContextSnapshot,
    getReorderAdviceList,
} from "../services/aiContextService";

const askSchema = z.object({
    question: z
        .string()
        .min(2, "Vui lòng nhập câu hỏi tối thiểu 2 ký tự")
        .max(500, "Câu hỏi tối đa 500 ký tự"),
    contextSummary: z.string().max(2000, "Tóm tắt ngữ cảnh tối đa 2000 ký tự").optional(),
});

const generateDescSchema = z.object({
    name: z
        .string()
        .min(2, "Tên sản phẩm là bắt buộc")
        .max(200, "Tên sản phẩm tối đa 200 ký tự"),
    category: z.string().max(100, "Tên danh mục tối đa 100 ký tự").optional(),
    brand: z.string().max(100, "Tên thương hiệu tối đa 100 ký tự").optional(),
});

const renameSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống").max(100, "Tiêu đề tối đa 100 ký tự"),
});

export const askAI = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const validated = askSchema.parse(req.body);
        const result = await askInventoryAssistant(
            validated.question,
            validated.contextSummary,
        );

        sendSuccess(res, result, "Tạo câu trả lời từ AI thành công");
    },
);

export const getWarehouseSnapshotAI = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
        const data = await getWarehouseContextSnapshot();
        sendSuccess(res, data.snapshot, "Lấy thông tin tổng quan kho thành công");
    },
);

export const getReorderAdviceAI = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
        const advice = await getReorderAdviceList();
        sendSuccess(res, advice, "Lấy danh sách đề xuất đặt hàng thành công");
    },
);

export const generateDescriptionAI = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const validated = generateDescSchema.parse(req.body);
        const description = await generateProductDescription(validated);

        sendSuccess(res, { description }, "Sinh mô tả từ AI thành công");
    },
);

export const getChatSessions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?._id;
        const sessions = await AIChatSession.find({ user: userId })
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

        sendSuccess(res, summaries, "Lấy danh sách phiên chat thành công");
    },
);

export const getChatSessionById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.user?._id;
        const session = await AIChatSession.findOne({
            _id: req.params.id,
            user: userId,
        });

        if (!session) {
            return next(new AppError("Không tìm thấy phiên chat", 404));
        }

        sendSuccess(
            res,
            {
                id: session._id.toString(),
                title: session.title,
                messages: session.messages,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            },
            "Lấy chi tiết phiên chat thành công",
        );
    },
);

export const createChatSession = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?._id;
        const title = req.body.title?.trim() || "Đoạn chat mới";

        const newSession = await AIChatSession.create({
            user: userId,
            title,
            messages: [],
        });

        sendSuccess(
            res,
            {
                id: newSession._id.toString(),
                title: newSession.title,
                messages: newSession.messages,
                createdAt: newSession.createdAt,
                updatedAt: newSession.updatedAt,
            },
            "Khởi tạo phiên chat thành công",
        );
    },
);

export const sendMessageToSession = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.user?._id;
        const sessionId = req.params.id;
        const validated = askSchema.parse(req.body);

        let session = null;
        if (sessionId && sessionId !== "new") {
            session = await AIChatSession.findOne({ _id: sessionId, user: userId });
        }

        if (!session) {
            session = await AIChatSession.create({
                user: userId,
                title: "Đoạn chat mới",
                messages: [],
            });
        }

        const isFirstQuestion =
            session.messages.length === 0 || session.title === "Đoạn chat mới";

        const nowVN = new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const userMsg: IAIChatMessage = {
            id: `usr-${Date.now()}`,
            sender: "user",
            text: validated.question,
            timestamp: nowVN,
        };

        const result = await askInventoryAssistant(
            validated.question,
            validated.contextSummary,
        );

        const aiMsg: IAIChatMessage = {
            id: `ai-${Date.now()}`,
            sender: "assistant",
            text: result.reply,
            timestamp: nowVN,
            suggestions: result.suggestions,
        };

        session.messages.push(userMsg, aiMsg);

        if (isFirstQuestion) {
            try {
                const autoTitle = await generateChatTitle(validated.question);
                if (autoTitle && autoTitle.trim().length > 0) {
                    session.title = autoTitle.trim();
                }
            } catch (err) {
                console.error("Lỗi tự động tạo tiêu đề:", err);
            }
        }

        await session.save();

        sendSuccess(
            res,
            {
                sessionId: session._id.toString(),
                title: session.title,
                messages: session.messages,
                reply: result.reply,
                suggestions: result.suggestions,
            },
            "Gửi tin nhắn vào phiên chat thành công",
        );
    },
);

export const deleteChatSession = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.user?._id;
        const session = await AIChatSession.findOneAndDelete({
            _id: req.params.id,
            user: userId,
        });

        if (!session) {
            return next(new AppError("Không tìm thấy phiên chat để xóa", 404));
        }

        sendSuccess(res, null, "Xóa phiên chat thành công");
    },
);

export const renameChatSession = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.user?._id;
        const validated = renameSchema.parse(req.body);

        const session = await AIChatSession.findOneAndUpdate(
            { _id: req.params.id, user: userId },
            { title: validated.title },
            { new: true },
        );

        if (!session) {
            return next(new AppError("Không tìm thấy phiên chat để đổi tên", 404));
        }

        sendSuccess(
            res,
            { id: session._id.toString(), title: session.title },
            "Cập nhật tiêu đề phiên chat thành công",
        );
    },
);

