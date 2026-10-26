import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
export default function ReportsPage() {
    const [status, setStatus] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");
    const { data } = useQuery({
        queryKey: ["report-preview", status],
        queryFn: async () => (await api.get("/items/", { params: { status: status || undefined, page_size: 10 } })).data,
    });
    async function downloadCsv() {
        setDownloading(true);
        setDownloadError("");
        try {
            // Streamed server-side by /items-export/ -- flat memory use on the
            // backend regardless of register size, unlike paging through the API
            // client-side. responseType 'blob' so axios doesn't try to parse the
            // CSV as JSON.
            const response = await api.get("/items-export/", {
                params: { status: status || undefined },
                responseType: "blob",
            });
            const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `treasury-asset-register-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
        catch {
            setDownloadError("Could not generate the export. Try again.");
        }
        finally {
            setDownloading(false);
        }
    }
    return (_jsxs("div", { className: "p-6 max-w-3xl mx-auto space-y-5", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Reports" }), _jsxs("div", { className: "card p-5 space-y-4", children: [_jsxs("div", { className: "flex items-end gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "label", children: "Filter by status" }), _jsxs("select", { className: "input-field", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "", children: "All statuses" }), _jsx("option", { value: "in_store", children: "In store" }), _jsx("option", { value: "issued", children: "Issued" }), _jsx("option", { value: "under_repair", children: "Under repair" }), _jsx("option", { value: "lost", children: "Lost / missing" }), _jsx("option", { value: "disposed", children: "Disposed" })] })] }), _jsx("button", { className: "btn-primary", onClick: downloadCsv, disabled: downloading, children: downloading ? "Preparing..." : "Export CSV" })] }), downloadError && _jsx("p", { className: "text-xs text-treasury-red", children: downloadError }), _jsx("p", { className: "text-xs text-treasury-slate", children: "Preview below shows the first 10 matching records. The export is generated and streamed server-side, so it stays fast even for a very large register." })] }), data && (_jsx("div", { className: "card overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-treasury-slate bg-slate-50 border-b border-slate-200", children: [_jsx("th", { className: "py-2 px-4", children: "Name" }), _jsx("th", { className: "px-4", children: "Asset tag" }), _jsx("th", { className: "px-4", children: "Status" })] }) }), _jsx("tbody", { children: data.results.map((r) => (_jsxs("tr", { className: "border-b border-slate-100", children: [_jsx("td", { className: "py-2 px-4", children: r.name }), _jsx("td", { className: "px-4 font-mono text-xs", children: r.asset_tag }), _jsx("td", { className: "px-4 capitalize", children: r.status.replace("_", " ") })] }, r.id))) })] }) }))] }));
}
