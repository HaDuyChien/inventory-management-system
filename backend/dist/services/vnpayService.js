"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentUrl = createPaymentUrl;
exports.verifyReturnUrl = verifyReturnUrl;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
function formatVNPayDate(date) {
    const tzOffset = 7 * 60;
    const localTime = new Date(date.getTime() + (tzOffset + date.getTimezoneOffset()) * 60000);
    const yyyy = localTime.getFullYear().toString();
    const MM = String(localTime.getMonth() + 1).padStart(2, "0");
    const dd = String(localTime.getDate()).padStart(2, "0");
    const HH = String(localTime.getHours()).padStart(2, "0");
    const mm = String(localTime.getMinutes()).padStart(2, "0");
    const ss = String(localTime.getSeconds()).padStart(2, "0");
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}
function createPaymentUrl(order, ipAddr) {
    const createDate = formatVNPayDate(new Date());
    const orderInfo = `Thanh toan don hang ${order.orderNumber}`;
    const tmnCode = env_1.env.VNPAY_TMN_CODE;
    const secretKey = env_1.env.VNPAY_HASH_SECRET;
    const vnpUrl = env_1.env.VNPAY_URL;
    const returnUrl = env_1.env.VNPAY_RETURN_URL;
    const vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: order.orderNumber,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Amount: Math.round(order.totalAmount * 100),
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr || "127.0.0.1",
        vnp_CreateDate: createDate,
    };
    const sortedKeys = Object.keys(vnp_Params).sort();
    const signDataArr = [];
    const queryParamsArr = [];
    for (const key of sortedKeys) {
        const val = vnp_Params[key];
        if (val !== null && val !== undefined && val !== "") {
            const encodedKey = encodeURIComponent(key);
            const encodedVal = encodeURIComponent(String(val)).replace(/%20/g, "+");
            signDataArr.push(`${encodedKey}=${encodedVal}`);
            queryParamsArr.push(`${encodedKey}=${encodedVal}`);
        }
    }
    const signData = signDataArr.join("&");
    const hmac = crypto_1.default.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    queryParamsArr.push(`vnp_SecureHash=${signed}`);
    return `${vnpUrl}?${queryParamsArr.join("&")}`;
}
function verifyReturnUrl(queryParams) {
    const secureHash = queryParams["vnp_SecureHash"];
    const secretKey = env_1.env.VNPAY_HASH_SECRET;
    const cleanParams = {};
    for (const key in queryParams) {
        if (key.startsWith("vnp_") && key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
            cleanParams[key] = String(queryParams[key]);
        }
    }
    const sortedKeys = Object.keys(cleanParams).sort();
    const signDataArr = [];
    for (const key of sortedKeys) {
        const val = cleanParams[key];
        if (val !== null && val !== undefined && val !== "") {
            const encodedKey = encodeURIComponent(key);
            const encodedVal = encodeURIComponent(String(val)).replace(/%20/g, "+");
            signDataArr.push(`${encodedKey}=${encodedVal}`);
        }
    }
    const signData = signDataArr.join("&");
    const hmac = crypto_1.default.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    const rawSignData = sortedKeys.map((k) => `${k}=${cleanParams[k]}`).join("&");
    const rawSigned = crypto_1.default.createHmac("sha512", secretKey).update(Buffer.from(rawSignData, "utf-8")).digest("hex");
    const isValid = Boolean(secureHash &&
        (String(secureHash).toLowerCase() === signed.toLowerCase() ||
            String(secureHash).toLowerCase() === rawSigned.toLowerCase()));
    const responseCode = String(queryParams["vnp_ResponseCode"] || "");
    const isSuccess = responseCode === "00";
    const responseMessages = {
        "00": "Giao dịch thành công",
        "07": "Trừ tiền thành công, giao dịch bị nghi ngờ",
        "09": "Thẻ chưa đăng ký dịch vụ Internet Banking",
        "10": "Khách hàng xác thực thông tin sai quá 3 lần",
        "11": "Hết hạn chờ thanh toán",
        "12": "Thẻ hoặc tài khoản bị khóa",
        "13": "Mật khẩu OTP xác thực không đúng",
        "24": "Khách hàng hủy giao dịch",
        "51": "Tài khoản không đủ số dư để thanh toán",
        "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày",
        "75": "Ngân hàng thanh toán đang bảo trì",
        "79": "Nhập sai mật khẩu thanh toán quá số lần quy định",
        "99": "Lỗi không xác định từ cổng thanh toán",
    };
    const message = responseMessages[responseCode] || (isSuccess ? "Giao dịch thành công" : "Giao dịch không thành công");
    const amount = Number(queryParams["vnp_Amount"] || 0) / 100;
    return {
        isValid,
        isSuccess,
        orderNumber: String(queryParams["vnp_TxnRef"] || ""),
        transactionNo: String(queryParams["vnp_TransactionNo"] || ""),
        bankCode: String(queryParams["vnp_BankCode"] || ""),
        payDate: String(queryParams["vnp_PayDate"] || ""),
        amount,
        responseCode,
        message,
    };
}
