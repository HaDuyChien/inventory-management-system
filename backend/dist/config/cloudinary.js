"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCloudinaryConfigured = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("./env");
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
    secure: true,
});
const isCloudinaryConfigured = () => {
    return Boolean(env_1.env.CLOUDINARY_CLOUD_NAME &&
        env_1.env.CLOUDINARY_API_KEY &&
        env_1.env.CLOUDINARY_API_SECRET &&
        env_1.env.CLOUDINARY_API_KEY !== env_1.env.CLOUDINARY_API_SECRET);
};
exports.isCloudinaryConfigured = isCloudinaryConfigured;
exports.default = cloudinary_1.v2;
