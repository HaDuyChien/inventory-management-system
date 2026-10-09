import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "primary";
    isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "danger",
    isLoading = false,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <Button variant="utility" size="sm" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === "danger" ? "danger" : "primary"}
                        size="sm"
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <div className="flex gap-3.5">
                <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        variant === "danger"
                            ? "bg-[#eb5757]/10 text-[#eb5757]"
                            : "bg-[#dd5b00]/10 text-[#dd5b00]"
                    }`}
                >
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-[15px] font-semibold text-[#000000]">{title}</h4>
                    <p className="text-[13px] text-[#615d59] mt-1 leading-relaxed">{message}</p>
                </div>
            </div>
        </Modal>
    );
};
