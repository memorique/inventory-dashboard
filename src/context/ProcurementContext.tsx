import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  purchaseOrders as defaultPurchaseOrders,
  suppliers as defaultSuppliers,
} from "../data/suppliers";
import type {
  NewSupplier,
  PurchaseOrder,
  PurchaseOrderLine,
  ReorderSuggestion,
  Supplier,
} from "../types/inventory";
import {
  generatePoNumber,
  getOnOrderByItem,
  getProcurementStats,
  groupSuggestionsBySupplier,
} from "../utils/procurement";
import { useInventory } from "./InventoryContext";

const SUPPLIERS_KEY = "inventory-suppliers";
const POS_KEY = "inventory-purchase-orders";

export interface CreatePoInput {
  supplierId: string;
  lines: PurchaseOrderLine[];
  notes: string;
  expectedAt: string | null;
  status: "draft" | "ordered";
}

export interface UpdatePoInput {
  supplierId: string;
  lines: PurchaseOrderLine[];
  notes: string;
  expectedAt: string | null;
}

interface ProcurementContextValue {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onOrderByItem: Record<string, number>;
  stats: ReturnType<typeof getProcurementStats>;
  addSupplier: (input: NewSupplier) => string | null;
  updateSupplier: (id: string, input: NewSupplier) => string | null;
  deleteSupplier: (id: string) => void;
  createPurchaseOrder: (input: CreatePoInput) => string;
  updatePurchaseOrder: (id: string, input: UpdatePoInput) => void;
  placeOrder: (id: string) => void;
  receivePurchaseOrder: (id: string) => void;
  cancelPurchaseOrder: (id: string) => void;
  deletePurchaseOrder: (id: string) => void;
  createDraftsFromReorders: (
    suggestions: ReorderSuggestion[]
  ) => { created: number; unmatched: string[] };
  resetProcurement: () => void;
}

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

function loadSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(SUPPLIERS_KEY);
    return raw ? (JSON.parse(raw) as Supplier[]) : defaultSuppliers;
  } catch {
    return defaultSuppliers;
  }
}

function loadPurchaseOrders(): PurchaseOrder[] {
  try {
    const raw = localStorage.getItem(POS_KEY);
    return raw ? (JSON.parse(raw) as PurchaseOrder[]) : defaultPurchaseOrders;
  } catch {
    return defaultPurchaseOrders;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const { adjustStock } = useInventory();
  const [suppliers, setSuppliers] = useState<Supplier[]>(loadSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(
    loadPurchaseOrders
  );

  useEffect(() => {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(POS_KEY, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  const addSupplier = useCallback(
    (input: NewSupplier): string | null => {
      const name = input.name.trim();
      if (!name) return "Supplier name is required.";
      if (input.leadTimeDays < 0) return "Lead time cannot be negative.";
      const duplicate = suppliers.some(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      );
      if (duplicate) return "A supplier with this name already exists.";

      const supplier: Supplier = {
        id: crypto.randomUUID(),
        name,
        contactName: input.contactName.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        leadTimeDays: input.leadTimeDays,
        categories: input.categories.map((c) => c.trim()).filter(Boolean),
        notes: input.notes.trim(),
        createdAt: today(),
      };
      setSuppliers((prev) => [...prev, supplier]);
      return null;
    },
    [suppliers]
  );

  const updateSupplier = useCallback(
    (id: string, input: NewSupplier): string | null => {
      const name = input.name.trim();
      if (!name) return "Supplier name is required.";
      if (input.leadTimeDays < 0) return "Lead time cannot be negative.";
      const duplicate = suppliers.some(
        (s) => s.id !== id && s.name.toLowerCase() === name.toLowerCase()
      );
      if (duplicate) return "A supplier with this name already exists.";

      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                name,
                contactName: input.contactName.trim(),
                email: input.email.trim(),
                phone: input.phone.trim(),
                leadTimeDays: input.leadTimeDays,
                categories: input.categories
                  .map((c) => c.trim())
                  .filter(Boolean),
                notes: input.notes.trim(),
              }
            : s
        )
      );
      return null;
    },
    [suppliers]
  );

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const createPurchaseOrder = useCallback(
    (input: CreatePoInput): string => {
      const id = crypto.randomUUID();
      const supplier = suppliers.find((s) => s.id === input.supplierId);
      const createdAt = today();
      const isOrdered = input.status === "ordered";
      const expectedAt =
        input.expectedAt ??
        (isOrdered && supplier
          ? addDays(createdAt, supplier.leadTimeDays)
          : null);

      const po: PurchaseOrder = {
        id,
        poNumber: generatePoNumber(purchaseOrders),
        supplierId: input.supplierId,
        supplierName: supplier?.name ?? "Unknown supplier",
        status: input.status,
        lines: input.lines,
        notes: input.notes.trim(),
        createdAt,
        orderedAt: isOrdered ? createdAt : null,
        expectedAt,
        receivedAt: null,
      };
      setPurchaseOrders((prev) => [po, ...prev]);
      return id;
    },
    [purchaseOrders, suppliers]
  );

  const updatePurchaseOrder = useCallback(
    (id: string, input: UpdatePoInput) => {
      const supplier = suppliers.find((s) => s.id === input.supplierId);
      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.id === id && po.status === "draft"
            ? {
                ...po,
                supplierId: input.supplierId,
                supplierName: supplier?.name ?? po.supplierName,
                lines: input.lines,
                notes: input.notes.trim(),
                expectedAt: input.expectedAt,
              }
            : po
        )
      );
    },
    [suppliers]
  );

  const placeOrder = useCallback(
    (id: string) => {
      setPurchaseOrders((prev) =>
        prev.map((po) => {
          if (po.id !== id || po.status !== "draft") return po;
          const supplier = suppliers.find((s) => s.id === po.supplierId);
          const orderedAt = today();
          return {
            ...po,
            status: "ordered",
            orderedAt,
            expectedAt:
              po.expectedAt ??
              (supplier ? addDays(orderedAt, supplier.leadTimeDays) : null),
          };
        })
      );
    },
    [suppliers]
  );

  const receivePurchaseOrder = useCallback(
    (id: string) => {
      const po = purchaseOrders.find((p) => p.id === id);
      if (!po || po.status === "received" || po.status === "cancelled") return;

      for (const line of po.lines) {
        adjustStock(line.itemId, line.quantity, "receive");
      }

      setPurchaseOrders((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: "received", receivedAt: today() }
            : p
        )
      );
    },
    [purchaseOrders, adjustStock]
  );

  const cancelPurchaseOrder = useCallback((id: string) => {
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === id && po.status !== "received"
          ? { ...po, status: "cancelled" }
          : po
      )
    );
  }, []);

  const deletePurchaseOrder = useCallback((id: string) => {
    setPurchaseOrders((prev) => prev.filter((po) => po.id !== id));
  }, []);

  const createDraftsFromReorders = useCallback(
    (suggestions: ReorderSuggestion[]) => {
      const { groups, unmatched } = groupSuggestionsBySupplier(
        suggestions,
        suppliers
      );
      if (groups.length === 0) {
        return { created: 0, unmatched: unmatched.map((i) => i.name) };
      }

      const createdAt = today();
      setPurchaseOrders((prev) => {
        let running = prev;
        const newPos: PurchaseOrder[] = [];
        for (const group of groups) {
          const po: PurchaseOrder = {
            id: crypto.randomUUID(),
            poNumber: generatePoNumber([...running, ...newPos]),
            supplierId: group.supplierId,
            supplierName: group.supplierName,
            status: "draft",
            lines: group.lines,
            notes: "Generated from reorder list.",
            createdAt,
            orderedAt: null,
            expectedAt: null,
            receivedAt: null,
          };
          newPos.push(po);
        }
        running = [...newPos, ...running];
        return running;
      });

      return { created: groups.length, unmatched: unmatched.map((i) => i.name) };
    },
    [suppliers]
  );

  const resetProcurement = useCallback(() => {
    setSuppliers(defaultSuppliers);
    setPurchaseOrders(defaultPurchaseOrders);
    localStorage.removeItem(SUPPLIERS_KEY);
    localStorage.removeItem(POS_KEY);
  }, []);

  const onOrderByItem = useMemo(
    () => getOnOrderByItem(purchaseOrders),
    [purchaseOrders]
  );
  const stats = useMemo(
    () => getProcurementStats(purchaseOrders),
    [purchaseOrders]
  );

  const value = useMemo(
    () => ({
      suppliers,
      purchaseOrders,
      onOrderByItem,
      stats,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      createPurchaseOrder,
      updatePurchaseOrder,
      placeOrder,
      receivePurchaseOrder,
      cancelPurchaseOrder,
      deletePurchaseOrder,
      createDraftsFromReorders,
      resetProcurement,
    }),
    [
      suppliers,
      purchaseOrders,
      onOrderByItem,
      stats,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      createPurchaseOrder,
      updatePurchaseOrder,
      placeOrder,
      receivePurchaseOrder,
      cancelPurchaseOrder,
      deletePurchaseOrder,
      createDraftsFromReorders,
      resetProcurement,
    ]
  );

  return (
    <ProcurementContext.Provider value={value}>
      {children}
    </ProcurementContext.Provider>
  );
}

export function useProcurement() {
  const ctx = useContext(ProcurementContext);
  if (!ctx) {
    throw new Error("useProcurement must be used within ProcurementProvider");
  }
  return ctx;
}
