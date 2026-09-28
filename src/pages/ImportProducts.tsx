import { ChangeEvent, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiUploadCloud,
} from "react-icons/fi";
import { usePermission } from "../context/AuthContext";
import { useInventory } from "../context/InventoryContext";
import { parseCsv } from "../utils/csv";
import {
  buildTemplateCsv,
  parseHeader,
  validateImportRows,
  type ImportRowResult,
} from "../utils/importInventory";

export default function ImportProducts() {
  const { items, addItem } = useInventory();
  const { canManageProducts } = usePermission();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportRowResult[] | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  const validCount = useMemo(
    () => results?.filter((r) => !r.error).length ?? 0,
    [results]
  );
  const errorCount = (results?.length ?? 0) - validCount;

  function resetState() {
    setFileName("");
    setHeaderError(null);
    setResults(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setHeaderError(null);
    setResults(null);
    setImportResult(null);
    setFileName(file.name);

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length === 0) {
      setHeaderError("The file is empty.");
      return;
    }

    const { indexByKey, missingLabels } = parseHeader(rows);
    if (missingLabels.length > 0) {
      setHeaderError(`Missing required column(s): ${missingLabels.join(", ")}.`);
      return;
    }

    setResults(validateImportRows(rows, indexByKey, items));
  }

  function handleImport() {
    if (!canManageProducts || !results) return;

    const validRows = results.filter((r) => !r.error);
    let imported = 0;
    const failures: { name: string; error: string }[] = [];

    for (const row of validRows) {
      const err = addItem(row.data);
      if (err) {
        failures.push({ name: row.data.name || row.data.sku, error: err });
      } else {
        imported++;
      }
    }

    const summary =
      failures.length === 0
        ? `Imported ${imported} product${imported === 1 ? "" : "s"}.`
        : `Imported ${imported} product${imported === 1 ? "" : "s"}. ${failures.length} failed: ${failures
            .map((f) => `${f.name} — ${f.error}`)
            .join("; ")}`;

    setImportResult(summary);
    setResults(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDownloadTemplate() {
    const blob = new Blob([buildTemplateCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import products</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bulk-create products from a CSV file
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {importResult && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {importResult}
          </p>
        )}
        {headerError && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {headerError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            <FiUploadCloud size={16} />
            Choose CSV file
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {fileName && (
            <span className="text-sm text-slate-600">{fileName}</span>
          )}
          {(results || fileName) && (
            <button
              type="button"
              onClick={resetState}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Choose a different file
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors ml-auto"
          >
            <FiDownload size={14} />
            Download CSV template
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Required columns (any order): sku, name, category, quantity,
          reorderLevel, unitPrice, location.
        </p>
      </div>

      {results && (
        <>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-emerald-700">
              {validCount} valid
            </span>
            {", "}
            <span className="font-medium text-rose-600">
              {errorCount} with errors
            </span>
          </p>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="px-4 py-3 font-semibold">SKU</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold text-right">Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Reorder
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Price
                    </th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={r.error ? "bg-rose-50/40" : undefined}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {r.raw.sku}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {r.raw.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.raw.category}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.data.quantity}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.data.reorderLevel}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        ${r.data.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate">
                        {r.raw.location}
                      </td>
                      <td className="px-4 py-3">
                        {r.error ? (
                          <span
                            title={r.error}
                            className="inline-flex items-center gap-1 text-rose-600"
                          >
                            <FiAlertCircle size={14} />
                            {r.error}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <FiCheckCircle size={14} />
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={!results || validCount === 0 || !canManageProducts}
          title={
            !canManageProducts
              ? "Managers and admins can import products"
              : undefined
          }
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiUploadCloud size={16} />
          Import {validCount > 0 ? validCount : ""} product
          {validCount === 1 ? "" : "s"}
        </button>
        <Link
          to="/dashboard/inventory"
          className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Back to inventory
        </Link>
      </div>
    </div>
  );
}
