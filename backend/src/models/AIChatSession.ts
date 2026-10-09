import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAIChatMessage {
    id: string;
    sender: "user" | "assistant";
    text: string;
    timestamp: string;
    suggestions?: string[];
}

export interface IAIChatSession extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    title: string;
    messages: IAIChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const AIChatMessageSchema = new Schema<IAIChatMessage>(
    {
        id: { type: String, required: true },
        sender: { type: String, enum: ["user", "assistant"], required: true },
        text: { type: String, required: true },
        timestamp: { type: String, required: true },
        suggestions: { type: [String], default: [] },
    },
    { _id: false },
);

const AIChatSessionSchema = new Schema<IAIChatSession>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true, default: "Đoạn chat mới" },
        messages: { type: [AIChatMessageSchema], default: [] },
    },
    {
        timestamps: true,
    },
);

AIChatSessionSchema.index({ user: 1, updatedAt: -1 });

export const AIChatSession = mongoose.model<IAIChatSession>(
    "AIChatSession",
    AIChatSessionSchema,
);
