export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type StockAction =
  | "restock"
  | "sale"
  | "adjustment"
  | "add"
  | "edit"
  | "remove"
  | "receive";

export interface NewInventoryItem {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  location: string;
}

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

export interface ReorderSuggestion {
  item: InventoryItem;
  suggestedQty: number;
  restockCost: number;
}

export interface StockPoint {
  date: string;
  quantity: number;
}

export type StockEventType =
  | "restock"
  | "reorder"
  | "low_stock"
  | "out_of_stock";

export interface StockEvent {
  id: string;
  date: string;
  type: StockEventType;
  quantity: number;
  delta?: number;
  note: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  categories: string[];
  notes: string;
  createdAt: string;
}

export interface NewSupplier {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  categories: string[];
  notes: string;
}

export type PurchaseOrderStatus =
  | "draft"
  | "ordered"
  | "received"
  | "cancelled";

export interface PurchaseOrderLine {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  notes: string;
  createdAt: string;
  orderedAt: string | null;
  expectedAt: string | null;
  receivedAt: string | null;
}

export type SalesOrderStatus =
  | "draft"
  | "confirmed"
  | "shipped"
  | "cancelled";

export interface SalesOrderLine {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: SalesOrderStatus;
  lines: SalesOrderLine[];
  notes: string;
  createdAt: string;
  confirmedAt: string | null;
  shipBy: string | null;
  shippedAt: string | null;
}
