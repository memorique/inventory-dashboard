# Inventory Dashboard

Basic React inventory dashboard with dummy data (no backend).

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- React Router

## Run locally

```bash
cd inventory-dashboard
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174).

## Pages

- **Dashboard** — stats and low/out-of-stock items
- **Inventory** — searchable table with filters; click a product for its detail page (stock, open orders, activity)
- **Categories** — category summary cards
- **Transfers** — move products between warehouses and bins
- **Customers** — customer directory with order counts and revenue, built from sales orders

Data lives in `src/data/dummyInventory.ts`.
