export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  location: string;
  status: StockStatus;
  lastUpdated: string;
}

export interface CategorySummary {
  name: string;
  itemCount: number;
  totalValue: number;
}
