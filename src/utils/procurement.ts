import type {
  InventoryItem,
  PurchaseOrder,
  PurchaseOrderLine,
  ReorderSuggestion,
  Supplier,
} from "../types/inventory";

export function getLinesTotal(lines: PurchaseOrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
}

export function getPoTotal(po: PurchaseOrder): number {
  return getLinesTotal(po.lines);
}

export function getPoUnits(po: PurchaseOrder): number {
  return po.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function generatePoNumber(existing: PurchaseOrder[]): string {
  let max = 1000;
  for (const po of existing) {
    const match = /PO-(\d+)/.exec(po.poNumber);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `PO-${max + 1}`;
}

export function findSupplierForCategory(
  category: string,
  suppliers: Supplier[]
): Supplier | undefined {
  return suppliers.find((s) => s.categories.includes(category));
}

/** Units currently on order (status "ordered") keyed by inventory item id. */
export function getOnOrderByItem(
  purchaseOrders: PurchaseOrder[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const po of purchaseOrders) {
    if (po.status !== "ordered") continue;
    for (const line of po.lines) {
      map[line.itemId] = (map[line.itemId] ?? 0) + line.quantity;
    }
  }
  return map;
}

export function getProcurementStats(purchaseOrders: PurchaseOrder[]) {
  const open = purchaseOrders.filter(
    (po) => po.status === "draft" || po.status === "ordered"
  );
  const ordered = purchaseOrders.filter((po) => po.status === "ordered");

  const openCount = open.length;
  const draftCount = purchaseOrders.filter((po) => po.status === "draft").length;
  const orderedCount = ordered.length;
  const onOrderUnits = ordered.reduce((sum, po) => sum + getPoUnits(po), 0);
  const openValue = open.reduce((sum, po) => sum + getPoTotal(po), 0);

  return { openCount, draftCount, orderedCount, onOrderUnits, openValue };
}

export interface DraftGroup {
  supplierId: string;
  supplierName: string;
  lines: PurchaseOrderLine[];
}

/**
 * Groups reorder suggestions into per-supplier draft groups using the
 * category → supplier mapping. Items without a matching supplier are
 * returned separately so the caller can surface them.
 */
export function groupSuggestionsBySupplier(
  suggestions: ReorderSuggestion[],
  suppliers: Supplier[]
): { groups: DraftGroup[]; unmatched: InventoryItem[] } {
  const groupMap = new Map<string, DraftGroup>();
  const unmatched: InventoryItem[] = [];

  for (const { item, suggestedQty } of suggestions) {
    const supplier = findSupplierForCategory(item.category, suppliers);
    if (!supplier) {
      unmatched.push(item);
      continue;
    }

    const line: PurchaseOrderLine = {
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      quantity: suggestedQty,
      unitCost: item.unitPrice,
    };

    const existing = groupMap.get(supplier.id);
    if (existing) {
      existing.lines.push(line);
    } else {
      groupMap.set(supplier.id, {
        supplierId: supplier.id,
        supplierName: supplier.name,
        lines: [line],
      });
    }
  }

  return { groups: Array.from(groupMap.values()), unmatched };
}

export const poStatusLabels: Record<PurchaseOrder["status"], string> = {
  draft: "Draft",
  ordered: "Ordered",
  received: "Received",
  cancelled: "Cancelled",
};

export const poStatusStyles: Record<PurchaseOrder["status"], string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  ordered: "bg-amber-50 text-amber-800 border-amber-200",
  received: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};
