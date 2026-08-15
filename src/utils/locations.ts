import type { InventoryItem } from "../types/inventory";

export interface BinSummary {
  bin: string;
  fullLocation: string;
  itemCount: number;
  totalUnits: number;
  totalValue: number;
  items: InventoryItem[];
}

export interface WarehouseSummary {
  warehouse: string;
  itemCount: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
  bins: BinSummary[];
}

export function parseWarehouse(location: string): string {
  const parts = location.split("·");
  return parts[0]?.trim() || "Unknown";
}

export function parseBin(location: string): string {
  const parts = location.split("·");
  return parts[1]?.trim() || location.trim();
}

export function getWarehouseSummaries(items: InventoryItem[]): WarehouseSummary[] {
  const map = new Map<string, Map<string, InventoryItem[]>>();

  for (const item of items) {
    const warehouse = parseWarehouse(item.location);
    const bin = parseBin(item.location);

    if (!map.has(warehouse)) {
      map.set(warehouse, new Map());
    }
    const bins = map.get(warehouse)!;
    if (!bins.has(bin)) {
      bins.set(bin, []);
    }
    bins.get(bin)!.push(item);
  }

  return Array.from(map.entries())
    .map(([warehouse, binsMap]) => {
      const bins: BinSummary[] = Array.from(binsMap.entries())
        .map(([bin, binItems]) => ({
          bin,
          fullLocation: `${warehouse} · ${bin}`,
          itemCount: binItems.length,
          totalUnits: binItems.reduce((s, i) => s + i.quantity, 0),
          totalValue: binItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
          items: binItems.sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.bin.localeCompare(b.bin));

      const allItems = bins.flatMap((b) => b.items);

      return {
        warehouse,
        itemCount: allItems.length,
        totalUnits: allItems.reduce((s, i) => s + i.quantity, 0),
        totalValue: allItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
        lowStockCount: allItems.filter((i) => i.status !== "in_stock").length,
        bins,
      };
    })
    .sort((a, b) => a.warehouse.localeCompare(b.warehouse));
}
