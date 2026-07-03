export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type StockAction = "restock" | "sale" | "adjustment";

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

export interface ActivityEntry {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  previousQty: number;
  newQty: number;
  change: number;
  action: StockAction;
  userName: string;
  timestamp: string;
}
