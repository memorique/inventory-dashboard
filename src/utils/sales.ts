import type {
  InventoryItem,
  SalesOrder,
  SalesOrderLine,
} from "../types/inventory";

export function getSoLinesTotal(lines: SalesOrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
}

export function getSoTotal(so: SalesOrder): number {
  return getSoLinesTotal(so.lines);
}

export function getSoUnits(so: SalesOrder): number {
  return so.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function generateSoNumber(existing: SalesOrder[]): string {
  let max = 5000;
  for (const so of existing) {
    const match = /SO-(\d+)/.exec(so.orderNumber);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `SO-${max + 1}`;
}

/** Units committed to confirmed (not yet shipped) orders, keyed by item id. */
export function getReservedByItem(
  salesOrders: SalesOrder[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const so of salesOrders) {
    if (so.status !== "confirmed") continue;
    for (const line of so.lines) {
      map[line.itemId] = (map[line.itemId] ?? 0) + line.quantity;
    }
  }
  return map;
}

/** On-hand quantity minus units reserved by confirmed orders. */
export function getAvailableQty(
  item: InventoryItem,
  reservedByItem: Record<string, number>
): number {
  return Math.max(0, item.quantity - (reservedByItem[item.id] ?? 0));
}

export interface LineShortage {
  line: SalesOrderLine;
  available: number;
}

/**
 * Lines that can't be covered by current stock. `reservedByItem` should not
 * include this order's own reservation (i.e. check drafts before confirming).
 * Lines whose product no longer exists are reported with 0 available.
 */
export function getShortages(
  lines: SalesOrderLine[],
  items: InventoryItem[],
  reservedByItem: Record<string, number>
): LineShortage[] {
  const shortages: LineShortage[] = [];
  for (const line of lines) {
    const item = items.find((i) => i.id === line.itemId);
    const available = item ? getAvailableQty(item, reservedByItem) : 0;
    if (line.quantity > available) {
      shortages.push({ line, available });
    }
  }
  return shortages;
}

export function getSalesStats(salesOrders: SalesOrder[]) {
  const confirmed = salesOrders.filter((so) => so.status === "confirmed");
  const open = salesOrders.filter(
    (so) => so.status === "draft" || so.status === "confirmed"
  );
  const shipped = salesOrders.filter((so) => so.status === "shipped");

  const draftCount = salesOrders.filter((so) => so.status === "draft").length;
  const toShipCount = confirmed.length;
  const reservedUnits = confirmed.reduce((sum, so) => sum + getSoUnits(so), 0);
  const openValue = open.reduce((sum, so) => sum + getSoTotal(so), 0);
  const shippedValue = shipped.reduce((sum, so) => sum + getSoTotal(so), 0);

  return {
    openCount: open.length,
    draftCount,
    toShipCount,
    reservedUnits,
    openValue,
    shippedCount: shipped.length,
    shippedValue,
  };
}

export const soStatusLabels: Record<SalesOrder["status"], string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

export const soStatusStyles: Record<SalesOrder["status"], string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  shipped: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};
