import type {
  CategorySummary,
  InventoryItem,
  ReorderSuggestion,
  StockStatus,
} from "../types/inventory";

export function computeStatus(
  quantity: number,
  reorderLevel: number
): StockStatus {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= reorderLevel) return "low_stock";
  return "in_stock";
}

export function withComputedStatus(item: InventoryItem): InventoryItem {
  return {
    ...item,
    status: computeStatus(item.quantity, item.reorderLevel),
  };
}

export function getCategorySummaries(items: InventoryItem[]): CategorySummary[] {
  const map = new Map<string, CategorySummary>();

  for (const item of items) {
    const existing = map.get(item.category);
    const value = item.quantity * item.unitPrice;

    if (existing) {
      existing.itemCount += 1;
      existing.totalValue += value;
    } else {
      map.set(item.category, {
        name: item.category,
        itemCount: 1,
        totalValue: value,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getInventoryStats(items: InventoryItem[]) {
  const totalItems = items.length;
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );
  const lowStock = items.filter((i) => i.status === "low_stock").length;
  const outOfStock = items.filter((i) => i.status === "out_of_stock").length;

  return { totalItems, totalUnits, totalValue, lowStock, outOfStock };
}

export function getSuggestedReorderQty(item: InventoryItem): number {
  const target = item.reorderLevel * 2;
  return Math.max(target - item.quantity, item.reorderLevel);
}

export function getReorderSuggestions(items: InventoryItem[]): ReorderSuggestion[] {
  return items
    .filter((i) => i.status !== "in_stock")
    .map((item) => {
      const suggestedQty = getSuggestedReorderQty(item);
      return {
        item,
        suggestedQty,
        restockCost: suggestedQty * item.unitPrice,
      };
    })
    .sort((a, b) => {
      if (a.item.status === "out_of_stock" && b.item.status !== "out_of_stock") {
        return -1;
      }
      if (b.item.status === "out_of_stock" && a.item.status !== "out_of_stock") {
        return 1;
      }
      return a.item.quantity - b.item.quantity;
    });
}
