import * as XLSX from "xlsx";

export interface ExportColumn {
    header: string;
    key: string;
    format?: (value: any, row: any) => string;
}

export interface ExportOptions {
    filename: string;
    title: string;
    columns: ExportColumn[];
    data: any[];
}

export function exportToExcel({ filename, columns, data }: ExportOptions): void {
    const headers = columns.map((c) => c.header);
    const rows = data.map((item) =>
        columns.map((c) => {
            const val = item[c.key];
            return c.format ? c.format(val, item) : val ?? "";
        }),
    );

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const colWidths = columns.map((c, idx) => {
        let maxLen = c.header.length;
        rows.forEach((r) => {
            const cellVal = String(r[idx] ?? "");
            if (cellVal.length > maxLen) maxLen = cellVal.length;
        });
        return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dữ liệu");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF({ title, filename, columns, data }: ExportOptions): void {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const headersHtml = columns
        .map(
            (c) =>
                `<th style="border: 1px solid #d1d5db; padding: 8px 10px; background-color: #f3f4f6; font-weight: bold; font-size: 11px; text-align: left;">${c.header}</th>`,
        )
        .join("");

    const rowsHtml = data
        .map((item, idx) => {
            const bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
            const cells = columns
                .map((c) => {
                    const val = item[c.key];
                    const display = c.format ? c.format(val, item) : val ?? "";
                    return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 11px;">${display}</td>`;
                })
                .join("");
            return `<tr style="background-color: ${bg};">${cells}</tr>`;
        })
        .join("");

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
                @media print {
                    @page { size: A4 landscape; margin: 12mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    color: #111827;
                    padding: 24px;
                    margin: 0;
                }
                .header {
                    margin-bottom: 20px;
                    border-bottom: 2px solid #0075de;
                    padding-bottom: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #0075de;
                    margin: 0 0 4px 0;
                }
                .meta {
                    font-size: 11px;
                    color: #6b7280;
                    margin: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1 class="title">${title}</h1>
                    <p class="meta">Hệ thống quản lý kho InventoHub</p>
                </div>
                <div style="text-align: right;">
                    <p class="meta">Thời gian xuất: ${new Date().toLocaleString("vi-VN")}</p>
                    <p class="meta">Tổng số bản ghi: ${data.length}</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>${headersHtml}</tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}
