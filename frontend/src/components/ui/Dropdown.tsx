import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";

export interface DropdownItem {
    id: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    danger?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

export interface DropdownProps {
    trigger: React.ReactNode;
    items: (DropdownItem | "divider")[];
    align?: "left" | "right";
    className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
    trigger,
    items,
    align = "right",
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={cn(
                        "absolute mt-1.5 w-52 rounded-[8px] bg-white border border-[#e6e6e6] shadow-notion-md py-1 z-50 text-[13.5px] animate-in fade-in zoom-in-95 duration-100",
                        align === "right" ? "right-0" : "left-0",
                        className,
                    )}
                >
                    {items.map((item, index) => {
                        if (item === "divider") {
                            return (
                                <div
                                    key={`div-${index}`}
                                    className="my-1 border-t border-[#e6e6e6]"
                                />
                            );
                        }

                        return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={item.disabled}
                                onClick={() => {
                                    if (item.disabled) return;
                                    item.onClick?.();
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors select-none",
                                    item.danger
                                        ? "text-[#eb5757] hover:bg-[#eb5757]/10"
                                        : "text-[#31302e] hover:bg-[#f6f5f4] hover:text-[#000000]",
                                    item.disabled && "opacity-40 cursor-not-allowed",
                                )}
                            >
                                {item.icon && (
                                    <span className="w-4 h-4 shrink-0 text-[#615d59]">
                                        {item.icon}
                                    </span>
                                )}
                                <span className="flex-1">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
