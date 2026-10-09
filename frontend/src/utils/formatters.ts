export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
    if (Math.abs(amount) >= 1_000_000_000) {
        return `${(amount / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} Tỷ ₫`;
    }
    if (Math.abs(amount) >= 1_000_000) {
        return `${(amount / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} Tr ₫`;
    }
    return formatCurrency(amount);
}

export function formatNumber(num: number): string {
    return new Intl.NumberFormat("vi-VN").format(num);
}

export function formatDate(dateString: string | Date): string {
    if (!dateString) return "—";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export function formatDateTime(dateString: string | Date): string {
    if (!dateString) return "—";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
