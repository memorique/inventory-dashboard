import type { CustomerReturn } from "../types/inventory";

export const customerReturns: CustomerReturn[] = [
  {
    id: "rma-seed-1",
    rmaNumber: "RMA-7001",
    salesOrderId: "so-seed-1",
    orderNumber: "SO-5001",
    customerName: "Brightside Coworking",
    status: "received",
    reason: "not_needed",
    lines: [
      {
        itemId: "9",
        sku: "SKU-5001",
        name: "Notebook A5 — Ruled (Pack of 3)",
        quantity: 4,
        unitPrice: 9.99,
        disposition: "restock",
      },
    ],
    notes: "Over-ordered; unopened packs returned.",
    createdAt: "2026-05-27",
    receivedAt: "2026-05-29",
  },
  {
    id: "rma-seed-2",
    rmaNumber: "RMA-7002",
    salesOrderId: "so-seed-1",
    orderNumber: "SO-5001",
    customerName: "Brightside Coworking",
    status: "requested",
    reason: "damaged",
    lines: [
      {
        itemId: "9",
        sku: "SKU-5001",
        name: "Notebook A5 — Ruled (Pack of 3)",
        quantity: 2,
        unitPrice: 9.99,
        disposition: "scrap",
      },
    ],
    notes: "Water damage reported by customer — photos on file.",
    createdAt: "2026-06-05",
    receivedAt: null,
  },
];
