import type {
  CustomerReturn,
  ReturnLine,
  ReturnReason,
  SalesOrder,
} from "../types/inventory";

export function getReturnLinesTotal(lines: ReturnLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
}

export function getReturnTotal(ret: CustomerReturn): number {
  return getReturnLinesTotal(ret.lines);
}

export function getReturnUnits(ret: CustomerReturn): number {
  return ret.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function getRestockUnits(ret: CustomerReturn): number {
  return ret.lines
    .filter((l) => l.disposition === "restock")
    .reduce((sum, l) => sum + l.quantity, 0);
}

export function getScrapValue(ret: CustomerReturn): number {
  return getReturnLinesTotal(ret.lines.filter((l) => l.disposition === "scrap"));
}

export function generateRmaNumber(existing: CustomerReturn[]): string {
  let max = 7000;
  for (const ret of existing) {
    const match = /RMA-(\d+)/.exec(ret.rmaNumber);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `RMA-${max + 1}`;
}

/**
 * Units already claimed by returns against a sales order, keyed by item id.
 * Rejected returns don't count; `excludeReturnId` lets a return be checked
 * without counting itself.
 */
export function getReturnedByItem(
  returns: CustomerReturn[],
  salesOrderId: string,
  excludeReturnId?: string
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const ret of returns) {
    if (ret.salesOrderId !== salesOrderId) continue;
    if (ret.status === "rejected" || ret.id === excludeReturnId) continue;
    for (const line of ret.lines) {
      map[line.itemId] = (map[line.itemId] ?? 0) + line.quantity;
    }
  }
  return map;
}

/** Remaining returnable units per item on a shipped order. */
export function getReturnableByItem(
  so: SalesOrder,
  returns: CustomerReturn[],
  excludeReturnId?: string
): Record<string, number> {
  const returned = getReturnedByItem(returns, so.id, excludeReturnId);
  const map: Record<string, number> = {};
  for (const line of so.lines) {
    map[line.itemId] = Math.max(0, line.quantity - (returned[line.itemId] ?? 0));
  }
  return map;
}

export function hasReturnableUnits(
  so: SalesOrder,
  returns: CustomerReturn[]
): boolean {
  if (so.status !== "shipped") return false;
  return Object.values(getReturnableByItem(so, returns)).some((q) => q > 0);
}

export function getReturnStats(returns: CustomerReturn[]) {
  const open = returns.filter((r) => r.status === "requested");
  const received = returns.filter((r) => r.status === "received");

  return {
    openCount: open.length,
    openUnits: open.reduce((sum, r) => sum + getReturnUnits(r), 0),
    receivedCount: received.length,
    restockedUnits: received.reduce((sum, r) => sum + getRestockUnits(r), 0),
    refundValue: received.reduce((sum, r) => sum + getReturnTotal(r), 0),
    scrapValue: received.reduce((sum, r) => sum + getScrapValue(r), 0),
  };
}

export const returnReasonLabels: Record<ReturnReason, string> = {
  damaged: "Damaged in transit",
  defective: "Defective",
  wrong_item: "Wrong item sent",
  not_needed: "No longer needed",
  other: "Other",
};

/** Damaged/defective goods usually can't be resold. */
export function defaultDisposition(reason: ReturnReason): ReturnLine["disposition"] {
  return reason === "damaged" || reason === "defective" ? "scrap" : "restock";
}

export const returnStatusLabels: Record<CustomerReturn["status"], string> = {
  requested: "Requested",
  received: "Received",
  rejected: "Rejected",
};

export const returnStatusStyles: Record<CustomerReturn["status"], string> = {
  requested: "bg-amber-50 text-amber-800 border-amber-200",
  received: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export const dispositionLabels: Record<ReturnLine["disposition"], string> = {
  restock: "Restock",
  scrap: "Write off",
};
