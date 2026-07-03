import type { InventoryItem, StockEvent, StockPoint } from "../types/inventory";

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export interface StockHistory {
  points: StockPoint[];
  events: StockEvent[];
}

export function generateStockHistory(item: InventoryItem): StockHistory {
  const rng = createRng(hashSeed(item.id));
  const days = 90;
  const startDate = addDays(new Date(), -days);

  const targetQty = item.quantity;
  const reorderLevel = item.reorderLevel;

  // Start from a higher quantity and simulate down to current
  const startQty = Math.max(
    targetQty + Math.floor(rng() * reorderLevel * 3) + reorderLevel,
    reorderLevel * 2
  );

  const rawPoints: StockPoint[] = [];
  let qty = startQty;

  rawPoints.push({ date: formatDate(startDate), quantity: qty });

  for (let i = 1; i < days; i++) {
    const date = formatDate(addDays(startDate, i));
    const roll = rng();

    if (roll < 0.08 && qty < reorderLevel * 2) {
      // Restock / reorder
      const delta = Math.floor(reorderLevel * (1.5 + rng() * 2));
      qty += delta;
    } else if (roll < 0.75) {
      // Gradual sales
      const decrease = Math.max(1, Math.floor(rng() * 5));
      qty = Math.max(0, qty - decrease);
    }
    // else: no change

    rawPoints.push({ date, quantity: qty });
  }

  // Anchor last point to current quantity
  const lastIdx = rawPoints.length - 1;
  rawPoints[lastIdx] = {
    ...rawPoints[lastIdx],
    quantity: targetQty,
  };

  // Derive events from raw walk
  const events: StockEvent[] = [];
  let eventCounter = 0;

  for (let i = 1; i < rawPoints.length; i++) {
    const prev = rawPoints[i - 1];
    const curr = rawPoints[i];
    const delta = curr.quantity - prev.quantity;

    if (delta > 0) {
      const isReorder = prev.quantity <= reorderLevel;
      const type = isReorder ? "reorder" : "restock";
      events.push({
        id: `${item.id}-evt-${eventCounter++}`,
        date: curr.date,
        type,
        quantity: curr.quantity,
        delta,
        note: isReorder
          ? `Reorder placed — ${delta} units added (now ${curr.quantity})`
          : `Stock added — ${delta} units (now ${curr.quantity})`,
      });
    }

    const wasAboveLow = prev.quantity > reorderLevel;
    const isAtOrBelowLow = curr.quantity > 0 && curr.quantity <= reorderLevel;
    const wasAboveZero = prev.quantity > 0;
    const isZero = curr.quantity === 0;

    if (wasAboveLow && isAtOrBelowLow) {
      events.push({
        id: `${item.id}-evt-${eventCounter++}`,
        date: curr.date,
        type: "low_stock",
        quantity: curr.quantity,
        note: `Stock deemed low — ${curr.quantity} units remaining (reorder level: ${reorderLevel})`,
      });
    }

    if (wasAboveZero && isZero) {
      events.push({
        id: `${item.id}-evt-${eventCounter++}`,
        date: curr.date,
        type: "out_of_stock",
        quantity: 0,
        note: "Out of stock — inventory depleted",
      });
    }
  }

  return { points: rawPoints, events: events.reverse() };
}
