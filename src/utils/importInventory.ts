import { mapHeaders, toCsv, type ColumnDef } from "./csv";
import type { InventoryItem, NewInventoryItem } from "../types/inventory";

type ColumnKey = keyof NewInventoryItem;

const COLUMN_DEFS: ColumnDef<ColumnKey>[] = [
  { key: "sku", label: "sku", match: "sku" },
  { key: "name", label: "name", match: "name" },
  { key: "category", label: "category", match: "category" },
  { key: "quantity", label: "quantity", match: "quantity" },
  { key: "reorderLevel", label: "reorderLevel", match: "reorderlevel" },
  { key: "unitPrice", label: "unitPrice", match: "unitprice" },
  { key: "location", label: "location", match: "location" },
];

export interface ImportRowResult {
  rowNumber: number;
  raw: Record<ColumnKey, string>;
  data: NewInventoryItem;
  error: string | null;
}

export function parseHeader(rows: string[][]): {
  indexByKey: Record<ColumnKey, number>;
  missingLabels: string[];
} {
  return mapHeaders(rows[0] ?? [], COLUMN_DEFS);
}

function cell(row: string[], index: number): string {
  return (row[index] ?? "").trim();
}

function toNumber(value: string): number {
  return Number(value) || 0;
}

export function validateImportRows(
  rows: string[][],
  indexByKey: Record<ColumnKey, number>,
  existingItems: InventoryItem[]
): ImportRowResult[] {
  const results: ImportRowResult[] = [];
  const existingSkus = new Set(
    existingItems.map((i) => i.sku.toUpperCase())
  );
  const seenSkus = new Map<string, number>();

  const dataRows = rows.slice(1);
  let rowNumber = 0;

  for (const row of dataRows) {
    rowNumber += 1;
    if (row.every((c) => c.trim() === "")) continue;

    const sku = cell(row, indexByKey.sku);
    const name = cell(row, indexByKey.name);
    const category = cell(row, indexByKey.category);
    const location = cell(row, indexByKey.location);
    const quantity = toNumber(cell(row, indexByKey.quantity));
    const reorderLevel = toNumber(cell(row, indexByKey.reorderLevel));
    const unitPrice = toNumber(cell(row, indexByKey.unitPrice));

    const raw: Record<ColumnKey, string> = {
      sku,
      name,
      category,
      quantity: cell(row, indexByKey.quantity),
      reorderLevel: cell(row, indexByKey.reorderLevel),
      unitPrice: cell(row, indexByKey.unitPrice),
      location,
    };

    const data: NewInventoryItem = {
      sku,
      name,
      category,
      quantity,
      reorderLevel,
      unitPrice,
      location,
    };

    let error: string | null = null;

    if (!sku || !name || !category || !location) {
      error = "Please fill in all required fields.";
    } else if (quantity < 0 || reorderLevel < 0 || unitPrice < 0) {
      error = "Quantity, reorder level, and price cannot be negative.";
    } else if (existingSkus.has(sku.toUpperCase())) {
      error = "An item with this SKU already exists.";
    } else {
      const normalizedSku = sku.toUpperCase();
      const firstRow = seenSkus.get(normalizedSku);
      if (firstRow !== undefined) {
        error = `Duplicate SKU in this file (also on row ${firstRow}).`;
      } else {
        seenSkus.set(normalizedSku, rowNumber);
      }
    }

    results.push({ rowNumber, raw, data, error });
  }

  return results;
}

export function buildTemplateCsv(): string {
  const header = [
    "sku",
    "name",
    "category",
    "quantity",
    "reorderLevel",
    "unitPrice",
    "location",
  ];
  const example = [
    "SKU-1001",
    "Wireless Mouse",
    "Electronics",
    "25",
    "10",
    "19.99",
    "Warehouse A · Shelf 3",
  ];
  return toCsv([header, example]);
}
