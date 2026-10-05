import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { customerReturns as defaultReturns } from "../data/returns";
import type {
  CustomerReturn,
  ReturnDisposition,
  ReturnLine,
  ReturnReason,
} from "../types/inventory";
import {
  generateRmaNumber,
  getReturnableByItem,
  getReturnStats,
} from "../utils/returns";
import { useInventory } from "./InventoryContext";
import { useSales } from "./SalesContext";

const RETURNS_KEY = "inventory-returns";

export interface ReturnInput {
  salesOrderId: string;
  reason: ReturnReason;
  lines: ReturnLine[];
  notes: string;
}

export type ReturnResult = { ok: true; id: string } | { ok: false; error: string };

interface ReturnsContextValue {
  returns: CustomerReturn[];
  stats: ReturnType<typeof getReturnStats>;
  createReturn: (input: ReturnInput) => ReturnResult;
  setLineDisposition: (
    id: string,
    itemId: string,
    disposition: ReturnDisposition
  ) => void;
  receiveReturn: (id: string) => string | null;
  rejectReturn: (id: string) => void;
  deleteReturn: (id: string) => void;
  resetReturns: () => void;
}

const ReturnsContext = createContext<ReturnsContextValue | null>(null);

function loadReturns(): CustomerReturn[] {
  try {
    const raw = localStorage.getItem(RETURNS_KEY);
    return raw ? (JSON.parse(raw) as CustomerReturn[]) : defaultReturns;
  } catch {
    return defaultReturns;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReturnsProvider({ children }: { children: ReactNode }) {
  const { applyStockChanges } = useInventory();
  const { salesOrders } = useSales();
  const [returns, setReturns] = useState<CustomerReturn[]>(loadReturns);

  useEffect(() => {
    localStorage.setItem(RETURNS_KEY, JSON.stringify(returns));
  }, [returns]);

  const createReturn = useCallback(
    (input: ReturnInput): ReturnResult => {
      const so = salesOrders.find((s) => s.id === input.salesOrderId);
      if (!so) return { ok: false, error: "Sales order not found." };
      if (so.status !== "shipped") {
        return { ok: false, error: "Only shipped orders can be returned." };
      }

      const lines = input.lines.filter((l) => l.quantity > 0);
      if (lines.length === 0) {
        return { ok: false, error: "Enter a quantity for at least one item." };
      }

      const returnable = getReturnableByItem(so, returns);
      for (const line of lines) {
        const max = returnable[line.itemId] ?? 0;
        if (line.quantity > max) {
          return {
            ok: false,
            error: `Only ${max} of ${line.name} can still be returned on ${so.orderNumber}.`,
          };
        }
      }

      const id = crypto.randomUUID();
      const ret: CustomerReturn = {
        id,
        rmaNumber: generateRmaNumber(returns),
        salesOrderId: so.id,
        orderNumber: so.orderNumber,
        customerName: so.customerName,
        status: "requested",
        reason: input.reason,
        lines,
        notes: input.notes.trim(),
        createdAt: today(),
        receivedAt: null,
      };
      setReturns((prev) => [ret, ...prev]);
      return { ok: true, id };
    },
    [salesOrders, returns]
  );

  const setLineDisposition = useCallback(
    (id: string, itemId: string, disposition: ReturnDisposition) => {
      setReturns((prev) =>
        prev.map((r) =>
          r.id === id && r.status === "requested"
            ? {
                ...r,
                lines: r.lines.map((l) =>
                  l.itemId === itemId ? { ...l, disposition } : l
                ),
              }
            : r
        )
      );
    },
    []
  );

  const receiveReturn = useCallback(
    (id: string): string | null => {
      const ret = returns.find((r) => r.id === id);
      if (!ret || ret.status !== "requested") {
        return "Only requested returns can be received.";
      }

      const err = applyStockChanges(
        ret.lines
          .filter((l) => l.disposition === "restock")
          .map((l) => ({ itemId: l.itemId, change: l.quantity })),
        "return"
      );
      if (err) return err;

      setReturns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "received", receivedAt: today() } : r
        )
      );
      return null;
    },
    [returns, applyStockChanges]
  );

  const rejectReturn = useCallback((id: string) => {
    setReturns((prev) =>
      prev.map((r) =>
        r.id === id && r.status === "requested"
          ? { ...r, status: "rejected" }
          : r
      )
    );
  }, []);

  const deleteReturn = useCallback((id: string) => {
    setReturns((prev) =>
      prev.filter((r) => r.id !== id || r.status === "received")
    );
  }, []);

  const resetReturns = useCallback(() => {
    setReturns(defaultReturns);
    localStorage.removeItem(RETURNS_KEY);
  }, []);

  const stats = useMemo(() => getReturnStats(returns), [returns]);

  const value = useMemo(
    () => ({
      returns,
      stats,
      createReturn,
      setLineDisposition,
      receiveReturn,
      rejectReturn,
      deleteReturn,
      resetReturns,
    }),
    [
      returns,
      stats,
      createReturn,
      setLineDisposition,
      receiveReturn,
      rejectReturn,
      deleteReturn,
      resetReturns,
    ]
  );

  return (
    <ReturnsContext.Provider value={value}>{children}</ReturnsContext.Provider>
  );
}

export function useReturns() {
  const ctx = useContext(ReturnsContext);
  if (!ctx) {
    throw new Error("useReturns must be used within ReturnsProvider");
  }
  return ctx;
}
