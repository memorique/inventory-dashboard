import type { CategorySummary, InventoryItem } from "../types/inventory";

export const inventoryItems: InventoryItem[] = [
  {
    id: "1",
    sku: "SKU-1001",
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    quantity: 142,
    reorderLevel: 25,
    unitPrice: 79.99,
    location: "Warehouse A · Shelf 12",
    status: "in_stock",
    lastUpdated: "2026-06-01",
  },
  {
    id: "2",
    sku: "SKU-1002",
    name: "USB-C Charging Cable (2m)",
    category: "Electronics",
    quantity: 18,
    reorderLevel: 30,
    unitPrice: 12.5,
    location: "Warehouse A · Shelf 14",
    status: "low_stock",
    lastUpdated: "2026-06-02",
  },
  {
    id: "3",
    sku: "SKU-2001",
    name: "Organic Cotton T-Shirt (M)",
    category: "Apparel",
    quantity: 0,
    reorderLevel: 20,
    unitPrice: 24.0,
    location: "Warehouse B · Rack 3",
    status: "out_of_stock",
    lastUpdated: "2026-05-28",
  },
  {
    id: "4",
    sku: "SKU-2002",
    name: "Denim Jacket (L)",
    category: "Apparel",
    quantity: 56,
    reorderLevel: 15,
    unitPrice: 89.0,
    location: "Warehouse B · Rack 5",
    status: "in_stock",
    lastUpdated: "2026-06-03",
  },
  {
    id: "5",
    sku: "SKU-3001",
    name: "Stainless Steel Water Bottle",
    category: "Home & Kitchen",
    quantity: 203,
    reorderLevel: 40,
    unitPrice: 18.75,
    location: "Warehouse A · Shelf 2",
    status: "in_stock",
    lastUpdated: "2026-06-03",
  },
  {
    id: "6",
    sku: "SKU-3002",
    name: "Ceramic Coffee Mug Set (4pk)",
    category: "Home & Kitchen",
    quantity: 12,
    reorderLevel: 24,
    unitPrice: 32.0,
    location: "Warehouse C · Bin 8",
    status: "low_stock",
    lastUpdated: "2026-06-01",
  },
  {
    id: "7",
    sku: "SKU-4001",
    name: "Yoga Mat — Premium",
    category: "Sports",
    quantity: 88,
    reorderLevel: 20,
    unitPrice: 45.0,
    location: "Warehouse C · Bin 2",
    status: "in_stock",
    lastUpdated: "2026-05-30",
  },
  {
    id: "8",
    sku: "SKU-4002",
    name: "Resistance Bands Kit",
    category: "Sports",
    quantity: 0,
    reorderLevel: 15,
    unitPrice: 28.5,
    location: "Warehouse C · Bin 4",
    status: "out_of_stock",
    lastUpdated: "2026-05-29",
  },
  {
    id: "9",
    sku: "SKU-5001",
    name: "Notebook A5 — Ruled (Pack of 3)",
    category: "Office",
    quantity: 310,
    reorderLevel: 50,
    unitPrice: 9.99,
    location: "Warehouse A · Shelf 1",
    status: "in_stock",
    lastUpdated: "2026-06-02",
  },
  {
    id: "10",
    sku: "SKU-5002",
    name: "Ballpoint Pen Box (50)",
    category: "Office",
    quantity: 22,
    reorderLevel: 35,
    unitPrice: 14.25,
    location: "Warehouse A · Shelf 1",
    status: "low_stock",
    lastUpdated: "2026-06-03",
  },
];

export const categories: CategorySummary[] = [
  { name: "Electronics", itemCount: 2, totalValue: 11565.6 },
  { name: "Apparel", itemCount: 2, totalValue: 4984.0 },
  { name: "Home & Kitchen", itemCount: 2, totalValue: 4190.25 },
  { name: "Sports", itemCount: 2, totalValue: 3960.0 },
  { name: "Office", itemCount: 2, totalValue: 3412.7 },
];

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
