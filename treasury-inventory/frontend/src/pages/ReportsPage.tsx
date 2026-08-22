import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { ItemListRow, CursorPage } from "../types/inventory";

export default function ReportsPage() {
  const [status, setStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const { data } = useQuery({
    queryKey: ["report-preview", status],
    queryFn: async () =>
      (await api.get<CursorPage<ItemListRow>>("/items/", { params: { status: status || undefined, page_size: 10 } })).data,
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
    } catch {
      setDownloadError("Could not generate the export. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-semibold">Reports</h1>

      <div className="card p-5 space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Filter by status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="in_store">In store</option>
              <option value="issued">Issued</option>
              <option value="under_repair">Under repair</option>
              <option value="lost">Lost / missing</option>
              <option value="disposed">Disposed</option>
            </select>
          </div>
          <button className="btn-primary" onClick={downloadCsv} disabled={downloading}>
            {downloading ? "Preparing..." : "Export CSV"}
          </button>
        </div>
        {downloadError && <p className="text-xs text-treasury-red">{downloadError}</p>}
        <p className="text-xs text-treasury-slate">
          Preview below shows the first 10 matching records. The export is generated and streamed
          server-side, so it stays fast even for a very large register.
        </p>
      </div>

      {data && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-treasury-slate bg-slate-50 border-b border-slate-200">
                <th className="py-2 px-4">Name</th>
                <th className="px-4">Asset tag</th>
                <th className="px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="py-2 px-4">{r.name}</td>
                  <td className="px-4 font-mono text-xs">{r.asset_tag}</td>
                  <td className="px-4 capitalize">{r.status.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
