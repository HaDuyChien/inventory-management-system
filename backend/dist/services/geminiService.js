"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatTitle = exports.generateProductDescription = exports.askInventoryAssistant = exports.generateForecastAnalysis = void 0;
const genai_1 = require("@google/genai");
const env_1 = require("../config/env");
const aiContextService_1 = require("./aiContextService");
const getGeminiClient = () => {
    if (!env_1.env.GEMINI_API_KEY || env_1.env.GEMINI_API_KEY.trim() === "") {
        return null;
    }
    return new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY });
};
const callGemini = async (contents, systemInstruction) => {
    const ai = getGeminiClient();
    if (!ai) {
        return null;
    }
    try {
        const response = await ai.models.generateContent({
            model: env_1.env.GEMINI_MODEL,
            contents,
            config: systemInstruction ? { systemInstruction } : undefined,
        });
        const text = response.text ? response.text.trim().replace(/[()（）]/g, "") : "";
        return text || null;
    }
    catch (error) {
        console.error("Lỗi gọi AI API:", error);
        return null;
    }
};
const generateForecastAnalysis = async (productData) => {
    const fallbackText = productData.stock === 0
        ? `Mặt hàng ${productData.name} hiện đã hết sạch hàng tồn kho. Cần tạo đơn mua hàng nhập kho ngay lập tức để tránh đứt gãy chuỗi cung ứng.`
        : productData.stock <= productData.minStock
            ? `Mặt hàng ${productData.name} đang ở mức tồn kho cảnh báo ${productData.stock} cái, thấp hơn ngưỡng tối thiểu ${productData.minStock} cái. Lượng hàng này chỉ đủ đáp ứng bán ra trong khoảng ${productData.daysRemaining} ngày.`
            : `Mặt hàng ${productData.name} có tốc độ tiêu thụ ổn định trung bình ${productData.averageDailySales} cái một ngày. Dự trữ tồn kho hiện tại dự kiến đáp ứng tốt trong ${productData.daysRemaining} ngày tiếp theo.`;
    if (!env_1.env.GEMINI_API_KEY || env_1.env.GEMINI_API_KEY.trim() === "") {
        return fallbackText;
    }
    const systemInstruction = `Bạn là chuyên gia phân tích chuỗi cung ứng và quản lý kho hàng của hệ thống InventoHub.
Yêu cầu:
Viết 2 đến 3 câu nhận định sắc bén, súc tích bằng tiếng Việt tự nhiên về mức độ rủi ro hết hàng và hướng xử lý nhập hàng cụ thể cho thủ kho.
Tuyệt đối không dùng dấu ngoặc đơn trong câu trả lời.`;
    const userPrompt = `Dưới đây là thông số thực tế của sản phẩm:
- Tên sản phẩm: ${productData.name}
- Mã SKU: ${productData.sku}
- Số lượng tồn kho hiện tại: ${productData.stock}
- Ngưỡng tồn kho tối thiểu: ${productData.minStock}
- Tốc độ tiêu thụ trung bình mỗi ngày: ${productData.averageDailySales} cái
- Dự báo nhu cầu 30 ngày tới: ${productData.forecast30Days} cái
- Đề xuất bổ sung hàng: ${productData.recommendedReorderQty} cái
- Số ngày dự kiến còn đủ hàng bán: ${productData.daysRemaining} ngày`;
    const result = await callGemini(userPrompt, systemInstruction);
    return result || fallbackText;
};
exports.generateForecastAnalysis = generateForecastAnalysis;
const askInventoryAssistant = async (question, contextSummary) => {
    if (!env_1.env.GEMINI_API_KEY || env_1.env.GEMINI_API_KEY.trim() === "") {
        return {
            reply: "Chưa cấu hình mã khóa API trợ lý AI trong hệ thống.",
            suggestions: [
                "Hàng sắp hết",
                "Tồn kho an toàn",
            ],
        };
    }
    let actualContext = contextSummary;
    if (!actualContext || actualContext.trim() === "") {
        const { summaryText } = await (0, aiContextService_1.getWarehouseContextSnapshot)();
        actualContext = summaryText;
    }
    const systemInstruction = `Bạn là Trợ lý AI Quản lý Kho thông minh InventoHub.
Dữ liệu kho thời gian thực:
${actualContext}

Quy định và giới hạn hoạt động:
1. Phạm vi nội dung: Bạn CHỈ trả lời các câu hỏi liên quan trực tiếp đến quản trị kho hàng, bao gồm hàng tồn kho, sản phẩm, danh mục, xuất nhập kho, đơn hàng, nhà cung cấp, khách hàng, công nợ và vận hành kho bãi.
Nếu người dùng chỉ chào hỏi, hãy chào lại ngắn gọn và giới thiệu bạn là trợ lý kho hàng.
Nếu câu hỏi KHÔNG liên quan đến quản lý kho hàng, hãy trả lời đúng câu sau: "Nội dung câu hỏi không thuộc phạm vi quản trị kho hàng. Vui lòng đặt câu hỏi liên quan đến hàng hóa, tồn kho hoặc vận hành kho." và không giải thích thêm chủ đề ngoài lề.
2. Trả lời thật ngắn gọn, súc tích, đi thẳng vào số liệu trọng tâm, không viết dài dòng lan man.
3. Nêu số lượng, tên sản phẩm hoặc mã SKU nếu có liên quan.
4. Trình bày bằng các gạch đầu dòng rõ ràng, dễ đọc.
5. Tuyệt đối không sử dụng dấu ngoặc đơn trong toàn bộ văn bản trả lời.`;
    const sanitizedQuestion = question.trim().slice(0, 500);
    const userPrompt = `Câu hỏi của người quản lý kho: "${sanitizedQuestion}"`;
    const result = await callGemini(userPrompt, systemInstruction);
    if (!result) {
        return {
            reply: "Lỗi kết nối với mô hình AI. Vui lòng thử lại sau.",
            suggestions: ["Thử lại"],
        };
    }
    const isOutOfScope = result.toLowerCase().includes("không thuộc phạm vi");
    const suggestions = isOutOfScope
        ? [
            "Mặt hàng sắp hết",
            "Giá trị tồn kho",
            "Sản phẩm bán chạy",
        ]
        : [
            "Hàng cần nhập ngay",
            "Công nợ nhà cung cấp",
            "Giá trị tồn kho",
        ];
    return {
        reply: result,
        suggestions,
    };
};
exports.askInventoryAssistant = askInventoryAssistant;
const generateProductDescription = async (data) => {
    const fallback = `Sản phẩm ${data.name} thuộc danh mục ${data.category || "hàng hóa kho vận"}, sản xuất bởi ${data.brand || "nhà cung cấp uy tín"}, đáp ứng các tiêu chuẩn chất lượng cao và quy cách đóng gói an toàn.`;
    if (!env_1.env.GEMINI_API_KEY || env_1.env.GEMINI_API_KEY.trim() === "") {
        return fallback;
    }
    const systemInstruction = `Bạn là trợ lý soạn thảo nội dung kỹ thuật và mô tả sản phẩm cho hệ thống quản lý kho và bán lẻ.
Yêu cầu:
Viết một đoạn mô tả chi tiết khoảng 3 đến 5 câu nêu bật thông số kỹ thuật, đặc điểm nổi bật, ứng dụng thực tế và lưu ý bảo quản trong kho hàng.
Viết bằng tiếng Việt tự nhiên, chuẩn mực.
Tuyệt đối không dùng dấu ngoặc đơn trong văn bản.`;
    const userPrompt = `Thông tin sản phẩm:
- Tên sản phẩm: ${data.name}
- Danh mục: ${data.category || "Hàng hóa tiêu chuẩn"}
- Hãng sản xuất: ${data.brand || "Thương hiệu chính hãng"}`;
    const result = await callGemini(userPrompt, systemInstruction);
    return result || fallback;
};
exports.generateProductDescription = generateProductDescription;
const generateChatTitle = async (firstQuestion) => {
    const cleanQuestion = firstQuestion.trim().slice(0, 100);
    if (!env_1.env.GEMINI_API_KEY || env_1.env.GEMINI_API_KEY.trim() === "") {
        return cleanQuestion.slice(0, 30) || "Đoạn chat mới";
    }
    const systemInstruction = `Bạn là trợ lý đặt tiêu đề cho các cuộc hội thoại quản trị kho bãi.
Nhiệm vụ: Đặt một tiêu đề ngắn gọn từ 3 đến 5 từ tiếng Việt tóm tắt câu hỏi của người dùng.
Quy tắc:
1. Không dùng dấu ngoặc kép, không dùng dấu ngoặc đơn, không dùng dấu chấm câu ở cuối.
2. Tiêu đề phải nêu bật được trọng tâm cần hỏi như tên mặt hàng, tồn kho, công nợ hoặc kiểm kê.
3. Chỉ trả về duy nhất chuỗi tiêu đề, không kèm lời giải thích nào khác.`;
    const userPrompt = `Câu hỏi của người dùng: "${cleanQuestion}"`;
    const result = await callGemini(userPrompt, systemInstruction);
    if (result) {
        const title = result.replace(/["'”’()（）]/g, "").trim();
        if (title.length > 0) {
            return title.slice(0, 50);
        }
    }
    return cleanQuestion.slice(0, 30) || "Đoạn chat mới";
};
exports.generateChatTitle = generateChatTitle;
