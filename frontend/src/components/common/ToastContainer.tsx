import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/useToastStore";
import { cn } from "@/utils/cn";

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle2 className="w-4 h-4 text-[#1aae39]" />,
        error: <AlertCircle className="w-4 h-4 text-[#eb5757]" />,
        warning: <AlertTriangle className="w-4 h-4 text-[#dd5b00]" />,
        info: <Info className="w-4 h-4 text-[#0075de]" />,
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={cn(
                        "pointer-events-auto flex items-start gap-3 p-3.5 bg-white border border-[#e6e6e6] rounded-[10px] shadow-notion-md transition-all animate-in slide-in-from-bottom-2 fade-in duration-200",
                    )}
                >
                    <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
                    <div className="flex-1 min-w-0">
                        <h5 className="text-[13.5px] font-semibold text-[#000000] leading-snug">
                            {t.title}
                        </h5>
                        {t.description && (
                            <p className="text-[12.5px] text-[#615d59] mt-0.5 leading-snug">
                                {t.description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => removeToast(t.id)}
                        className="text-[#a39e98] hover:text-[#000000] p-1 rounded hover:bg-black/5 shrink-0 cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
};
