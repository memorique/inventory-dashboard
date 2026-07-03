import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { inventoryItems as defaultItems } from "../data/dummyInventory";
import type {
  ActivityEntry,
  InventoryItem,
  StockAction,
} from "../types/inventory";
import {
  getCategorySummaries,
  getInventoryStats,
  withComputedStatus,
} from "../utils/inventory";
import { useAuth } from "./AuthContext";

const ITEMS_KEY = "inventory-items";
const ACTIVITY_KEY = "inventory-activity";

interface InventoryContextValue {
  items: InventoryItem[];
  activity: ActivityEntry[];
  stats: ReturnType<typeof getInventoryStats>;
  categories: ReturnType<typeof getCategorySummaries>;
  adjustStock: (itemId: string, change: number, action: StockAction) => void;
  resetInventory: () => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

function loadItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    const parsed = raw ? (JSON.parse(raw) as InventoryItem[]) : defaultItems;
    return parsed.map(withComputedStatus);
  } catch {
    return defaultItems.map(withComputedStatus);
  }
}

function loadActivity(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>(loadItems);
  const [activity, setActivity] = useState<ActivityEntry[]>(loadActivity);

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  }, [activity]);

  const adjustStock = useCallback(
    (itemId: string, change: number, action: StockAction) => {
      if (change === 0) return;

      setItems((prev) => {
        const index = prev.findIndex((i) => i.id === itemId);
        if (index === -1) return prev;

        const item = prev[index];
        const newQty = Math.max(0, item.quantity + change);
        if (newQty === item.quantity) return prev;

        const updated: InventoryItem = withComputedStatus({
          ...item,
          quantity: newQty,
          lastUpdated: new Date().toISOString().slice(0, 10),
        });

        const next = [...prev];
        next[index] = updated;

        const entry: ActivityEntry = {
          id: crypto.randomUUID(),
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          previousQty: item.quantity,
          newQty,
          change: newQty - item.quantity,
          action,
          userName: user?.name ?? "Unknown",
          timestamp: new Date().toISOString(),
        };

        setActivity((acts) => [entry, ...acts].slice(0, 100));
        return next;
      });
    },
    [user?.name]
  );

  const resetInventory = useCallback(() => {
    const reset = defaultItems.map(withComputedStatus);
    setItems(reset);
    setActivity([]);
    localStorage.removeItem(ITEMS_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
  }, []);

  const stats = useMemo(() => getInventoryStats(items), [items]);
  const categories = useMemo(() => getCategorySummaries(items), [items]);

  const value = useMemo(
    () => ({ items, activity, stats, categories, adjustStock, resetInventory }),
    [items, activity, stats, categories, adjustStock, resetInventory]
  );

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return ctx;
}
