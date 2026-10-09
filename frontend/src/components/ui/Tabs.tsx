import React from "react";
import { cn } from "@/utils/cn";

export interface TabItem {
    id: string;
    label: string;
    count?: number | string;
    icon?: React.ReactNode;
}

export interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    variant?: "underline" | "pills" | "segmented";
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    activeTab,
    onChange,
    variant = "underline",
    className,
}) => {
    if (variant === "segmented") {
        return (
            <div
                className={cn(
                    "inline-flex items-center p-1 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[8px] gap-1",
                    className,
                )}
            >
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-[6px] transition-all select-none cursor-pointer",
                                isActive
                                    ? "bg-white text-[#000000] shadow-notion-sm"
                                    : "text-[#615d59] hover:text-[#000000] hover:bg-black/5",
                            )}
                        >
                            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span
                                    className={cn(
                                        "text-[11px] px-1.5 py-0.2 rounded-full font-normal",
                                        isActive
                                            ? "bg-[#f6f5f4] text-[#31302e]"
                                            : "bg-black/5 text-[#615d59]",
                                    )}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "border-b border-[#e6e6e6] flex items-center gap-4 overflow-x-auto",
                className,
            )}
        >
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 py-2.5 px-1 border-b-2 font-medium text-[13.5px] transition-all whitespace-nowrap select-none cursor-pointer -mb-[1px]",
                            isActive
                                ? "border-[#0075de] text-[#0075de]"
                                : "border-transparent text-[#615d59] hover:text-[#000000] hover:border-[#d4d4d4]",
                        )}
                    >
                        {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span
                                className={cn(
                                    "text-[11px] px-1.5 py-0.5 rounded-full font-medium",
                                    isActive
                                        ? "bg-[#0075de]/10 text-[#0075de]"
                                        : "bg-[#f6f5f4] text-[#615d59] border border-[#e6e6e6]",
                                )}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
