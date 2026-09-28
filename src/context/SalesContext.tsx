import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { salesOrders as defaultSalesOrders } from "../data/salesOrders";
import type { SalesOrder, SalesOrderLine } from "../types/inventory";
import {
  generateSoNumber,
  getReservedByItem,
  getSalesStats,
  getShortages,
} from "../utils/sales";
import { useInventory } from "./InventoryContext";

const SOS_KEY = "inventory-sales-orders";

export interface SalesOrderInput {
  customerName: string;
  customerEmail: string;
  lines: SalesOrderLine[];
  notes: string;
  shipBy: string | null;
}

export type SalesResult = { ok: true; id: string } | { ok: false; error: string };

interface SalesContextValue {
  salesOrders: SalesOrder[];
  reservedByItem: Record<string, number>;
  stats: ReturnType<typeof getSalesStats>;
  createSalesOrder: (
    input: SalesOrderInput,
    status: "draft" | "confirmed"
  ) => SalesResult;
  updateSalesOrder: (id: string, input: SalesOrderInput) => string | null;
  confirmSalesOrder: (id: string) => string | null;
  shipSalesOrder: (id: string) => string | null;
  cancelSalesOrder: (id: string) => void;
  deleteSalesOrder: (id: string) => void;
  resetSales: () => void;
}

const SalesContext = createContext<SalesContextValue | null>(null);

function loadSalesOrders(): SalesOrder[] {
  try {
    const raw = localStorage.getItem(SOS_KEY);
    return raw ? (JSON.parse(raw) as SalesOrder[]) : defaultSalesOrders;
  } catch {
    return defaultSalesOrders;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function validateInput(input: SalesOrderInput): string | null {
  if (!input.customerName.trim()) return "Customer name is required.";
  if (input.lines.length === 0) return "Add at least one product to the order.";
  if (input.lines.some((l) => l.quantity <= 0)) {
    return "Every line must have a quantity greater than zero.";
  }
  return null;
}

function formatShortages(
  shortages: ReturnType<typeof getShortages>
): string {
  const detail = shortages
    .map((s) => `${s.line.name} (need ${s.line.quantity}, ${s.available} available)`)
    .join("; ");
  return `Not enough available stock: ${detail}.`;
}

export function SalesProvider({ children }: { children: ReactNode }) {
  const { items, applyStockChanges } = useInventory();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(loadSalesOrders);

  useEffect(() => {
    localStorage.setItem(SOS_KEY, JSON.stringify(salesOrders));
  }, [salesOrders]);

  const reservedByItem = useMemo(
    () => getReservedByItem(salesOrders),
    [salesOrders]
  );

  const createSalesOrder = useCallback(
    (input: SalesOrderInput, status: "draft" | "confirmed"): SalesResult => {
      const err = validateInput(input);
      if (err) return { ok: false, error: err };

      if (status === "confirmed") {
        const shortages = getShortages(input.lines, items, reservedByItem);
        if (shortages.length > 0) {
          return { ok: false, error: formatShortages(shortages) };
        }
      }

      const id = crypto.randomUUID();
      const createdAt = today();
      const so: SalesOrder = {
        id,
        orderNumber: generateSoNumber(salesOrders),
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail.trim(),
        status,
        lines: input.lines,
        notes: input.notes.trim(),
        createdAt,
        confirmedAt: status === "confirmed" ? createdAt : null,
        shipBy: input.shipBy,
        shippedAt: null,
      };
      setSalesOrders((prev) => [so, ...prev]);
      return { ok: true, id };
    },
    [items, reservedByItem, salesOrders]
  );

  const updateSalesOrder = useCallback(
    (id: string, input: SalesOrderInput): string | null => {
      const err = validateInput(input);
      if (err) return err;

      setSalesOrders((prev) =>
        prev.map((so) =>
          so.id === id && so.status === "draft"
            ? {
                ...so,
                customerName: input.customerName.trim(),
                customerEmail: input.customerEmail.trim(),
                lines: input.lines,
                notes: input.notes.trim(),
                shipBy: input.shipBy,
              }
            : so
        )
      );
      return null;
    },
    []
  );

  const confirmSalesOrder = useCallback(
    (id: string): string | null => {
      const so = salesOrders.find((s) => s.id === id);
      if (!so || so.status !== "draft") return "Only draft orders can be confirmed.";

      const shortages = getShortages(so.lines, items, reservedByItem);
      if (shortages.length > 0) return formatShortages(shortages);

      setSalesOrders((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "confirmed", confirmedAt: today() } : s
        )
      );
      return null;
    },
    [salesOrders, items, reservedByItem]
  );

  const shipSalesOrder = useCallback(
    (id: string): string | null => {
      const so = salesOrders.find((s) => s.id === id);
      if (!so || so.status !== "confirmed") {
        return "Only confirmed orders can be shipped.";
      }

      const err = applyStockChanges(
        so.lines.map((l) => ({ itemId: l.itemId, change: -l.quantity })),
        "sale"
      );
      if (err) return err;

      setSalesOrders((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "shipped", shippedAt: today() } : s
        )
      );
      return null;
    },
    [salesOrders, applyStockChanges]
  );

  const cancelSalesOrder = useCallback((id: string) => {
    setSalesOrders((prev) =>
      prev.map((so) =>
        so.id === id && (so.status === "draft" || so.status === "confirmed")
          ? { ...so, status: "cancelled" }
          : so
      )
    );
  }, []);

  const deleteSalesOrder = useCallback((id: string) => {
    setSalesOrders((prev) =>
      prev.filter((so) => so.id !== id || so.status === "confirmed")
    );
  }, []);

  const resetSales = useCallback(() => {
    setSalesOrders(defaultSalesOrders);
    localStorage.removeItem(SOS_KEY);
  }, []);

  const stats = useMemo(() => getSalesStats(salesOrders), [salesOrders]);

  const value = useMemo(
    () => ({
      salesOrders,
      reservedByItem,
      stats,
      createSalesOrder,
      updateSalesOrder,
      confirmSalesOrder,
      shipSalesOrder,
      cancelSalesOrder,
      deleteSalesOrder,
      resetSales,
    }),
    [
      salesOrders,
      reservedByItem,
      stats,
      createSalesOrder,
      updateSalesOrder,
      confirmSalesOrder,
      shipSalesOrder,
      cancelSalesOrder,
      deleteSalesOrder,
      resetSales,
    ]
  );

  return (
    <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
  );
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) {
    throw new Error("useSales must be used within SalesProvider");
  }
  return ctx;
}
