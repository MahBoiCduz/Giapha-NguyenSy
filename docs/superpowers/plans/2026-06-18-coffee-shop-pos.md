# Coffee Shop POS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-only, offline coffee shop POS where a barista takes orders, records Cash/Card payment, voids orders, edits the menu, reviews daily sales history, and backs up data.

**Architecture:** React + TypeScript single-page app built with Vite, persisting all data in the browser's IndexedDB (via Dexie). Pure calculation logic lives in `domain/` (no DB/UI), data access in `db/` (no UI), and React screens in `ui/`. All money is integer cents.

**Tech Stack:** Vite, React 18, TypeScript, Dexie (IndexedDB wrapper), Vitest + @testing-library/react + fake-indexeddb for tests.

## Global Constraints

- All monetary values are stored and computed as **integer cents** (`number`). Never store currency as floats/decimals. Convert to formatted strings only at display time.
- Payment method is the string union `"cash" | "card"`.
- Order status is the string union `"completed" | "voided"`.
- The app must function with **no network** — no remote calls, no CDN-required runtime fetches.
- IDs are strings generated with `crypto.randomUUID()`.
- Timestamps are stored as epoch milliseconds (`number`, from `Date.now()`).
- Day boundaries use the laptop's **local** time (local midnight to local midnight).
- Tests use `fake-indexeddb` so `db/` code runs in the Vitest (Node) environment.

---

### Task 1: Project scaffold and tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`, `src/test/setup.ts`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working Vite + React + TS + Vitest setup. `npm test` runs Vitest; `npm run dev` serves the app.

- [ ] **Step 1: Initialize package.json**

Create `package.json`:

```json
{
  "name": "coffee-shop-pos",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "dexie": "^4.0.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create config files**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
```

Create `.gitignore`:

```
node_modules
dist
*.local
```

- [ ] **Step 3: Create app entry points**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Coffee Shop POS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return <h1>Coffee Shop POS</h1>;
}
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Write the smoke test**

Create `src/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("tooling", () => {
  it("runs tests", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Install and run the smoke test**

Run: `npm install && npm test`
Expected: PASS — `smoke.test.ts` passes, 1 test.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Vitest project"
```

---

### Task 2: Domain types and money formatting

**Files:**
- Create: `src/domain/types.ts`, `src/domain/money.ts`
- Test: `src/domain/money.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Types: `Category { id: string; name: string; sortOrder: number }`,
    `Item { id: string; name: string; priceCents: number; categoryId: string; active: boolean }`,
    `OrderLine { itemId: string; nameSnapshot: string; priceCentsSnapshot: number; qty: number }`,
    `PaymentMethod = "cash" | "card"`, `OrderStatus = "completed" | "voided"`,
    `Order { id: string; timestamp: number; lineItems: OrderLine[]; totalCents: number; paymentMethod: PaymentMethod; status: OrderStatus; voidedAt?: number }`
  - `formatCents(cents: number): string` → e.g. `formatCents(1250) === "$12.50"`
  - `parseDollarsToCents(input: string): number` → e.g. `parseDollarsToCents("12.5") === 1250`

- [ ] **Step 1: Write the failing test**

Create `src/domain/money.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatCents, parseDollarsToCents } from "./money";

describe("formatCents", () => {
  it("formats whole dollars", () => {
    expect(formatCents(1200)).toBe("$12.00");
  });
  it("formats cents with padding", () => {
    expect(formatCents(1205)).toBe("$12.05");
  });
  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });
});

describe("parseDollarsToCents", () => {
  it("parses decimal dollars", () => {
    expect(parseDollarsToCents("12.50")).toBe(1250);
  });
  it("parses single-decimal dollars", () => {
    expect(parseDollarsToCents("12.5")).toBe(1250);
  });
  it("parses whole dollars", () => {
    expect(parseDollarsToCents("12")).toBe(1200);
  });
  it("throws on negative", () => {
    expect(() => parseDollarsToCents("-1")).toThrow();
  });
  it("throws on non-numeric", () => {
    expect(() => parseDollarsToCents("abc")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- money`
Expected: FAIL — cannot find module `./money`.

- [ ] **Step 3: Write the types**

Create `src/domain/types.ts`:

```ts
export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Item {
  id: string;
  name: string;
  priceCents: number;
  categoryId: string;
  active: boolean;
}

export interface OrderLine {
  itemId: string;
  nameSnapshot: string;
  priceCentsSnapshot: number;
  qty: number;
}

export type PaymentMethod = "cash" | "card";
export type OrderStatus = "completed" | "voided";

export interface Order {
  id: string;
  timestamp: number;
  lineItems: OrderLine[];
  totalCents: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  voidedAt?: number;
}
```

- [ ] **Step 4: Write the money implementation**

Create `src/domain/money.ts`:

```ts
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const remainder = (abs % 100).toString().padStart(2, "0");
  return `${sign}$${dollars}.${remainder}`;
}

export function parseDollarsToCents(input: string): number {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid price: "${input}"`);
  }
  const value = Math.round(parseFloat(trimmed) * 100);
  if (value < 0) {
    throw new Error(`Price cannot be negative: "${input}"`);
  }
  return value;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- money`
Expected: PASS — all money tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat: add domain types and money formatting"
```

---

### Task 3: Cart logic

**Files:**
- Create: `src/domain/cart.ts`
- Test: `src/domain/cart.test.ts`

**Interfaces:**
- Consumes: `Item`, `OrderLine` from `@/domain/types`.
- Produces (pure functions operating on `OrderLine[]`):
  - `addItem(lines: OrderLine[], item: Item): OrderLine[]` — adds item or increments qty if present.
  - `setQty(lines: OrderLine[], itemId: string, qty: number): OrderLine[]` — sets qty; removes line if qty <= 0.
  - `removeItem(lines: OrderLine[], itemId: string): OrderLine[]`
  - `cartTotalCents(lines: OrderLine[]): number`
  - `changeDueCents(totalCents: number, tenderedCents: number): number` — tendered minus total; throws if tendered < total.

- [ ] **Step 1: Write the failing test**

Create `src/domain/cart.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { addItem, setQty, removeItem, cartTotalCents, changeDueCents } from "./cart";
import type { Item, OrderLine } from "./types";

const latte: Item = { id: "i1", name: "Latte", priceCents: 450, categoryId: "c1", active: true };
const mocha: Item = { id: "i2", name: "Mocha", priceCents: 500, categoryId: "c1", active: true };

describe("addItem", () => {
  it("adds a new line with qty 1 and snapshots name/price", () => {
    const lines = addItem([], latte);
    expect(lines).toEqual([
      { itemId: "i1", nameSnapshot: "Latte", priceCentsSnapshot: 450, qty: 1 },
    ]);
  });
  it("increments qty when item already present", () => {
    const lines = addItem(addItem([], latte), latte);
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(2);
  });
  it("does not mutate the input array", () => {
    const input: OrderLine[] = [];
    addItem(input, latte);
    expect(input).toHaveLength(0);
  });
});

describe("setQty", () => {
  it("sets the quantity", () => {
    const lines = setQty(addItem([], latte), "i1", 3);
    expect(lines[0].qty).toBe(3);
  });
  it("removes the line when qty is 0", () => {
    const lines = setQty(addItem([], latte), "i1", 0);
    expect(lines).toHaveLength(0);
  });
});

describe("removeItem", () => {
  it("removes the matching line", () => {
    const start = addItem(addItem([], latte), mocha);
    expect(removeItem(start, "i1")).toEqual([
      { itemId: "i2", nameSnapshot: "Mocha", priceCentsSnapshot: 500, qty: 1 },
    ]);
  });
});

describe("cartTotalCents", () => {
  it("sums price * qty across lines", () => {
    let lines = addItem([], latte);
    lines = addItem(lines, latte);
    lines = addItem(lines, mocha);
    expect(cartTotalCents(lines)).toBe(450 * 2 + 500);
  });
  it("is 0 for an empty cart", () => {
    expect(cartTotalCents([])).toBe(0);
  });
});

describe("changeDueCents", () => {
  it("returns tendered minus total", () => {
    expect(changeDueCents(450, 500)).toBe(50);
  });
  it("returns 0 for exact tender", () => {
    expect(changeDueCents(450, 450)).toBe(0);
  });
  it("throws when tendered is less than total", () => {
    expect(() => changeDueCents(450, 400)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- cart`
Expected: FAIL — cannot find module `./cart`.

- [ ] **Step 3: Write the implementation**

Create `src/domain/cart.ts`:

```ts
import type { Item, OrderLine } from "./types";

export function addItem(lines: OrderLine[], item: Item): OrderLine[] {
  const existing = lines.find((l) => l.itemId === item.id);
  if (existing) {
    return lines.map((l) =>
      l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l
    );
  }
  return [
    ...lines,
    {
      itemId: item.id,
      nameSnapshot: item.name,
      priceCentsSnapshot: item.priceCents,
      qty: 1,
    },
  ];
}

export function setQty(lines: OrderLine[], itemId: string, qty: number): OrderLine[] {
  if (qty <= 0) {
    return removeItem(lines, itemId);
  }
  return lines.map((l) => (l.itemId === itemId ? { ...l, qty } : l));
}

export function removeItem(lines: OrderLine[], itemId: string): OrderLine[] {
  return lines.filter((l) => l.itemId !== itemId);
}

export function cartTotalCents(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.priceCentsSnapshot * l.qty, 0);
}

export function changeDueCents(totalCents: number, tenderedCents: number): number {
  if (tenderedCents < totalCents) {
    throw new Error("Tendered amount is less than total");
  }
  return tenderedCents - totalCents;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- cart`
Expected: PASS — all cart tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/cart.ts src/domain/cart.test.ts
git commit -m "feat: add cart calculation logic"
```

---

### Task 4: Report aggregation and day boundaries

**Files:**
- Create: `src/domain/report.ts`
- Test: `src/domain/report.test.ts`

**Interfaces:**
- Consumes: `Order` from `@/domain/types`.
- Produces:
  - `dayRange(date: Date): { startMs: number; endMs: number }` — local midnight (inclusive) to next local midnight (exclusive).
  - `ordersForDay(orders: Order[], date: Date): Order[]` — orders whose `timestamp` falls in `dayRange(date)`.
  - `ReportSummary { totalCents: number; orderCount: number; cashCents: number; cardCents: number; voidedCount: number; itemBreakdown: { name: string; qty: number; totalCents: number }[] }`
  - `summarize(orders: Order[]): ReportSummary` — aggregates a list of orders (typically one day). Voided orders are excluded from all totals and item breakdown, but counted in `voidedCount`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/report.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { dayRange, ordersForDay, summarize } from "./report";
import type { Order } from "./types";

function order(partial: Partial<Order>): Order {
  return {
    id: partial.id ?? "o1",
    timestamp: partial.timestamp ?? Date.now(),
    lineItems: partial.lineItems ?? [
      { itemId: "i1", nameSnapshot: "Latte", priceCentsSnapshot: 450, qty: 1 },
    ],
    totalCents: partial.totalCents ?? 450,
    paymentMethod: partial.paymentMethod ?? "cash",
    status: partial.status ?? "completed",
    voidedAt: partial.voidedAt,
  };
}

describe("dayRange", () => {
  it("spans local midnight to next local midnight", () => {
    const { startMs, endMs } = dayRange(new Date(2026, 5, 18, 14, 30));
    expect(new Date(startMs).getHours()).toBe(0);
    expect(new Date(startMs).getDate()).toBe(18);
    expect(endMs - startMs).toBe(24 * 60 * 60 * 1000);
  });
});

describe("ordersForDay", () => {
  it("includes orders within the day and excludes others", () => {
    const day = new Date(2026, 5, 18, 9, 0);
    const inside = order({ id: "in", timestamp: new Date(2026, 5, 18, 23, 0).getTime() });
    const outside = order({ id: "out", timestamp: new Date(2026, 5, 19, 1, 0).getTime() });
    const result = ordersForDay([inside, outside], day);
    expect(result.map((o) => o.id)).toEqual(["in"]);
  });
});

describe("summarize", () => {
  it("totals completed orders and splits by payment method", () => {
    const orders = [
      order({ id: "a", totalCents: 450, paymentMethod: "cash" }),
      order({ id: "b", totalCents: 500, paymentMethod: "card" }),
    ];
    const s = summarize(orders);
    expect(s.totalCents).toBe(950);
    expect(s.orderCount).toBe(2);
    expect(s.cashCents).toBe(450);
    expect(s.cardCents).toBe(500);
    expect(s.voidedCount).toBe(0);
  });

  it("excludes voided orders from totals but counts them", () => {
    const orders = [
      order({ id: "a", totalCents: 450, paymentMethod: "cash" }),
      order({ id: "b", totalCents: 500, paymentMethod: "card", status: "voided", voidedAt: Date.now() }),
    ];
    const s = summarize(orders);
    expect(s.totalCents).toBe(450);
    expect(s.orderCount).toBe(1);
    expect(s.cardCents).toBe(0);
    expect(s.voidedCount).toBe(1);
  });

  it("aggregates item breakdown by name across orders", () => {
    const orders = [
      order({
        id: "a",
        lineItems: [{ itemId: "i1", nameSnapshot: "Latte", priceCentsSnapshot: 450, qty: 2 }],
        totalCents: 900,
      }),
      order({
        id: "b",
        lineItems: [{ itemId: "i1", nameSnapshot: "Latte", priceCentsSnapshot: 450, qty: 1 }],
        totalCents: 450,
      }),
    ];
    const s = summarize(orders);
    expect(s.itemBreakdown).toEqual([{ name: "Latte", qty: 3, totalCents: 1350 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- report`
Expected: FAIL — cannot find module `./report`.

- [ ] **Step 3: Write the implementation**

Create `src/domain/report.ts`:

```ts
import type { Order } from "./types";

export interface ReportSummary {
  totalCents: number;
  orderCount: number;
  cashCents: number;
  cardCents: number;
  voidedCount: number;
  itemBreakdown: { name: string; qty: number; totalCents: number }[];
}

export function dayRange(date: Date): { startMs: number; endMs: number } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

export function ordersForDay(orders: Order[], date: Date): Order[] {
  const { startMs, endMs } = dayRange(date);
  return orders.filter((o) => o.timestamp >= startMs && o.timestamp < endMs);
}

export function summarize(orders: Order[]): ReportSummary {
  const summary: ReportSummary = {
    totalCents: 0,
    orderCount: 0,
    cashCents: 0,
    cardCents: 0,
    voidedCount: 0,
    itemBreakdown: [],
  };
  const breakdown = new Map<string, { name: string; qty: number; totalCents: number }>();

  for (const o of orders) {
    if (o.status === "voided") {
      summary.voidedCount += 1;
      continue;
    }
    summary.orderCount += 1;
    summary.totalCents += o.totalCents;
    if (o.paymentMethod === "cash") summary.cashCents += o.totalCents;
    else summary.cardCents += o.totalCents;

    for (const line of o.lineItems) {
      const entry = breakdown.get(line.nameSnapshot) ?? {
        name: line.nameSnapshot,
        qty: 0,
        totalCents: 0,
      };
      entry.qty += line.qty;
      entry.totalCents += line.priceCentsSnapshot * line.qty;
      breakdown.set(line.nameSnapshot, entry);
    }
  }

  summary.itemBreakdown = [...breakdown.values()].sort((a, b) => b.qty - a.qty);
  return summary;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- report`
Expected: PASS — all report tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/report.ts src/domain/report.test.ts
git commit -m "feat: add report aggregation and day-boundary logic"
```

---

### Task 5: Database layer (Dexie schema + data access)

**Files:**
- Create: `src/db/database.ts`, `src/db/repo.ts`
- Test: `src/db/repo.test.ts`

**Interfaces:**
- Consumes: `Category`, `Item`, `Order` from `@/domain/types`.
- Produces:
  - `db` — a Dexie instance with tables `categories`, `items`, `orders`.
  - Category fns: `listCategories(): Promise<Category[]>` (sorted by `sortOrder`), `addCategory(name: string): Promise<Category>`, `updateCategory(c: Category): Promise<void>`, `deleteCategory(id: string): Promise<void>`, `countItemsInCategory(id: string): Promise<number>`.
  - Item fns: `listItems(): Promise<Item[]>`, `listItemsByCategory(categoryId: string): Promise<Item[]>` (active only), `addItem(input: { name: string; priceCents: number; categoryId: string }): Promise<Item>`, `updateItem(i: Item): Promise<void>`, `deleteItem(id: string): Promise<void>`.
  - Order fns: `saveOrder(input: { lineItems: OrderLine[]; totalCents: number; paymentMethod: PaymentMethod }): Promise<Order>` (sets id, timestamp, status `"completed"`), `listOrders(): Promise<Order[]>`, `voidOrder(id: string): Promise<void>` (sets status `"voided"`, `voidedAt`).
  - Backup fns: `exportAll(): Promise<BackupData>`, `importAll(data: BackupData): Promise<void>` (clears then bulk-inserts). `BackupData { version: 1; categories: Category[]; items: Item[]; orders: Order[] }`.

- [ ] **Step 1: Write the failing test**

Create `src/db/repo.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./database";
import {
  listCategories, addCategory, updateCategory, deleteCategory, countItemsInCategory,
  listItemsByCategory, addItem, saveOrder, listOrders, voidOrder,
  exportAll, importAll,
} from "./repo";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("categories", () => {
  it("adds and lists categories", async () => {
    await addCategory("Espresso");
    const cats = await listCategories();
    expect(cats.map((c) => c.name)).toEqual(["Espresso"]);
  });
  it("counts items in a category", async () => {
    const cat = await addCategory("Espresso");
    await addItem({ name: "Latte", priceCents: 450, categoryId: cat.id });
    expect(await countItemsInCategory(cat.id)).toBe(1);
  });
  it("updates and deletes a category", async () => {
    const cat = await addCategory("Espreso");
    await updateCategory({ ...cat, name: "Espresso" });
    expect((await listCategories())[0].name).toBe("Espresso");
    await deleteCategory(cat.id);
    expect(await listCategories()).toHaveLength(0);
  });
});

describe("items", () => {
  it("adds and lists active items by category", async () => {
    const cat = await addCategory("Espresso");
    await addItem({ name: "Latte", priceCents: 450, categoryId: cat.id });
    const items = await listItemsByCategory(cat.id);
    expect(items).toHaveLength(1);
    expect(items[0].active).toBe(true);
  });
});

describe("orders", () => {
  it("saves an order as completed and lists it", async () => {
    const order = await saveOrder({
      lineItems: [{ itemId: "i1", nameSnapshot: "Latte", priceCentsSnapshot: 450, qty: 1 }],
      totalCents: 450,
      paymentMethod: "cash",
    });
    expect(order.status).toBe("completed");
    expect(typeof order.timestamp).toBe("number");
    const orders = await listOrders();
    expect(orders).toHaveLength(1);
  });
  it("voids an order", async () => {
    const order = await saveOrder({
      lineItems: [{ itemId: "i1", nameSnapshot: "Latte", priceCentsSnapshot: 450, qty: 1 }],
      totalCents: 450,
      paymentMethod: "cash",
    });
    await voidOrder(order.id);
    const reloaded = (await listOrders())[0];
    expect(reloaded.status).toBe("voided");
    expect(typeof reloaded.voidedAt).toBe("number");
  });
});

describe("backup", () => {
  it("exports and re-imports all data", async () => {
    const cat = await addCategory("Espresso");
    await addItem({ name: "Latte", priceCents: 450, categoryId: cat.id });
    const data = await exportAll();
    expect(data.version).toBe(1);

    await db.delete();
    await db.open();
    expect(await listCategories()).toHaveLength(0);

    await importAll(data);
    expect(await listCategories()).toHaveLength(1);
    expect(await listItemsByCategory(cat.id)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- repo`
Expected: FAIL — cannot find module `./database`.

- [ ] **Step 3: Write the Dexie schema**

Create `src/db/database.ts`:

```ts
import Dexie, { type Table } from "dexie";
import type { Category, Item, Order } from "@/domain/types";

export class PosDatabase extends Dexie {
  categories!: Table<Category, string>;
  items!: Table<Item, string>;
  orders!: Table<Order, string>;

  constructor() {
    super("coffee-shop-pos");
    this.version(1).stores({
      categories: "id, sortOrder",
      items: "id, categoryId",
      orders: "id, timestamp, status",
    });
  }
}

export const db = new PosDatabase();
```

- [ ] **Step 4: Write the data-access functions**

Create `src/db/repo.ts`:

```ts
import { db } from "./database";
import type {
  Category, Item, Order, OrderLine, PaymentMethod,
} from "@/domain/types";

export interface BackupData {
  version: 1;
  categories: Category[];
  items: Item[];
  orders: Order[];
}

// Categories
export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy("sortOrder").toArray();
}

export async function addCategory(name: string): Promise<Category> {
  const count = await db.categories.count();
  const category: Category = { id: crypto.randomUUID(), name, sortOrder: count };
  await db.categories.add(category);
  return category;
}

export async function updateCategory(c: Category): Promise<void> {
  await db.categories.put(c);
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id);
}

export async function countItemsInCategory(id: string): Promise<number> {
  return db.items.where("categoryId").equals(id).count();
}

// Items
export async function listItems(): Promise<Item[]> {
  return db.items.toArray();
}

export async function listItemsByCategory(categoryId: string): Promise<Item[]> {
  const items = await db.items.where("categoryId").equals(categoryId).toArray();
  return items.filter((i) => i.active);
}

export async function addItem(input: {
  name: string;
  priceCents: number;
  categoryId: string;
}): Promise<Item> {
  const item: Item = {
    id: crypto.randomUUID(),
    name: input.name,
    priceCents: input.priceCents,
    categoryId: input.categoryId,
    active: true,
  };
  await db.items.add(item);
  return item;
}

export async function updateItem(i: Item): Promise<void> {
  await db.items.put(i);
}

export async function deleteItem(id: string): Promise<void> {
  await db.items.delete(id);
}

// Orders
export async function saveOrder(input: {
  lineItems: OrderLine[];
  totalCents: number;
  paymentMethod: PaymentMethod;
}): Promise<Order> {
  const order: Order = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    lineItems: input.lineItems,
    totalCents: input.totalCents,
    paymentMethod: input.paymentMethod,
    status: "completed",
  };
  await db.orders.add(order);
  return order;
}

export async function listOrders(): Promise<Order[]> {
  return db.orders.orderBy("timestamp").reverse().toArray();
}

export async function voidOrder(id: string): Promise<void> {
  await db.orders.update(id, { status: "voided", voidedAt: Date.now() });
}

// Backup
export async function exportAll(): Promise<BackupData> {
  const [categories, items, orders] = await Promise.all([
    db.categories.toArray(),
    db.items.toArray(),
    db.orders.toArray(),
  ]);
  return { version: 1, categories, items, orders };
}

export async function importAll(data: BackupData): Promise<void> {
  if (data.version !== 1 || !data.categories || !data.items || !data.orders) {
    throw new Error("Invalid backup file");
  }
  await db.transaction("rw", db.categories, db.items, db.orders, async () => {
    await Promise.all([db.categories.clear(), db.items.clear(), db.orders.clear()]);
    await db.categories.bulkAdd(data.categories);
    await db.items.bulkAdd(data.items);
    await db.orders.bulkAdd(data.orders);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- repo`
Expected: PASS — all repo tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/db
git commit -m "feat: add IndexedDB schema and data-access layer"
```

---

### Task 6: Backup export/import helpers (file I/O)

**Files:**
- Create: `src/db/backup.ts`
- Test: `src/db/backup.test.ts`

**Interfaces:**
- Consumes: `exportAll`, `importAll`, `BackupData` from `@/db/repo`.
- Produces:
  - `serializeBackup(data: BackupData): string` — pretty JSON.
  - `parseBackup(json: string): BackupData` — parses and validates shape; throws on invalid.
  - `downloadBackup(): Promise<void>` — exports all, triggers a file download named `pos-backup-YYYY-MM-DD.json` (browser only).
  - `restoreFromFile(file: File): Promise<void>` — reads file text, parses, imports.

- [ ] **Step 1: Write the failing test**

Create `src/db/backup.test.ts` (tests the pure serialize/parse functions):

```ts
import { describe, it, expect } from "vitest";
import { serializeBackup, parseBackup } from "./backup";
import type { BackupData } from "./repo";

const sample: BackupData = {
  version: 1,
  categories: [{ id: "c1", name: "Espresso", sortOrder: 0 }],
  items: [{ id: "i1", name: "Latte", priceCents: 450, categoryId: "c1", active: true }],
  orders: [],
};

describe("serializeBackup / parseBackup", () => {
  it("round-trips backup data", () => {
    const json = serializeBackup(sample);
    expect(parseBackup(json)).toEqual(sample);
  });
  it("throws on malformed JSON", () => {
    expect(() => parseBackup("{not json")).toThrow();
  });
  it("throws on wrong version", () => {
    const bad = JSON.stringify({ ...sample, version: 2 });
    expect(() => parseBackup(bad)).toThrow();
  });
  it("throws when required arrays are missing", () => {
    const bad = JSON.stringify({ version: 1, categories: [] });
    expect(() => parseBackup(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- backup`
Expected: FAIL — cannot find module `./backup`.

- [ ] **Step 3: Write the implementation**

Create `src/db/backup.ts`:

```ts
import { exportAll, importAll, type BackupData } from "./repo";

export function serializeBackup(data: BackupData): string {
  return JSON.stringify(data, null, 2);
}

export function parseBackup(json: string): BackupData {
  const data = JSON.parse(json) as BackupData;
  if (
    data.version !== 1 ||
    !Array.isArray(data.categories) ||
    !Array.isArray(data.items) ||
    !Array.isArray(data.orders)
  ) {
    throw new Error("Invalid backup file");
  }
  return data;
}

export async function downloadBackup(): Promise<void> {
  const data = await exportAll();
  const json = serializeBackup(data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pos-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreFromFile(file: File): Promise<void> {
  const text = await file.text();
  const data = parseBackup(text);
  await importAll(data);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- backup`
Expected: PASS — all backup tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/db/backup.ts src/db/backup.test.ts
git commit -m "feat: add backup serialize/parse and file download/restore"
```

---

### Task 7: App shell, navigation, and seed-on-empty

**Files:**
- Create: `src/ui/useNavigation.ts`, `src/db/seed.ts`
- Modify: `src/App.tsx`
- Test: `src/db/seed.test.ts`

**Interfaces:**
- Consumes: `listCategories`, `addCategory`, `addItem` from `@/db/repo`.
- Produces:
  - `seedIfEmpty(): Promise<void>` — if no categories exist, inserts a starter menu (categories "Espresso", "Tea", "Pastries" with a couple items each).
  - `App` renders a top nav with four screens: Register, Menu, Reports, Backup, and switches between them by local state. (Screen components are stubbed here and filled in later tasks.)

- [ ] **Step 1: Write the failing test for seed**

Create `src/db/seed.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./database";
import { seedIfEmpty } from "./seed";
import { listCategories, listItems } from "./repo";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("seedIfEmpty", () => {
  it("inserts a starter menu when empty", async () => {
    await seedIfEmpty();
    expect((await listCategories()).length).toBeGreaterThan(0);
    expect((await listItems()).length).toBeGreaterThan(0);
  });
  it("does nothing when categories already exist", async () => {
    await seedIfEmpty();
    const before = (await listCategories()).length;
    await seedIfEmpty();
    expect((await listCategories()).length).toBe(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- seed`
Expected: FAIL — cannot find module `./seed`.

- [ ] **Step 3: Write the seed implementation**

Create `src/db/seed.ts`:

```ts
import { listCategories, addCategory, addItem } from "./repo";

export async function seedIfEmpty(): Promise<void> {
  const existing = await listCategories();
  if (existing.length > 0) return;

  const espresso = await addCategory("Espresso");
  const tea = await addCategory("Tea");
  const pastries = await addCategory("Pastries");

  await addItem({ name: "Espresso", priceCents: 300, categoryId: espresso.id });
  await addItem({ name: "Latte", priceCents: 450, categoryId: espresso.id });
  await addItem({ name: "Cappuccino", priceCents: 425, categoryId: espresso.id });
  await addItem({ name: "Green Tea", priceCents: 350, categoryId: tea.id });
  await addItem({ name: "Chai Latte", priceCents: 425, categoryId: tea.id });
  await addItem({ name: "Croissant", priceCents: 375, categoryId: pastries.id });
  await addItem({ name: "Muffin", priceCents: 350, categoryId: pastries.id });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- seed`
Expected: PASS.

- [ ] **Step 5: Write the navigation hook**

Create `src/ui/useNavigation.ts`:

```ts
import { useState } from "react";

export type Screen = "register" | "menu" | "reports" | "backup";

export function useNavigation(initial: Screen = "register") {
  const [screen, setScreen] = useState<Screen>(initial);
  return { screen, setScreen };
}
```

- [ ] **Step 6: Wire the App shell with stub screens**

Replace `src/App.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useNavigation, type Screen } from "./ui/useNavigation";
import { seedIfEmpty } from "./db/seed";

const TABS: { key: Screen; label: string }[] = [
  { key: "register", label: "Register" },
  { key: "menu", label: "Menu" },
  { key: "reports", label: "Reports" },
  { key: "backup", label: "Backup" },
];

export default function App() {
  const { screen, setScreen } = useNavigation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfEmpty().then(() => setReady(true));
  }, []);

  if (!ready) return <p>Loading…</p>;

  return (
    <div>
      <nav>
        {TABS.map((t) => (
          <button
            key={t.key}
            aria-current={screen === t.key ? "page" : undefined}
            onClick={() => setScreen(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main>
        {screen === "register" && <p>Register screen</p>}
        {screen === "menu" && <p>Menu screen</p>}
        {screen === "reports" && <p>Reports screen</p>}
        {screen === "backup" && <p>Backup screen</p>}
      </main>
    </div>
  );
}
```

- [ ] **Step 7: Run all tests**

Run: `npm test`
Expected: PASS — all prior suites still green.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/ui/useNavigation.ts src/db/seed.ts src/db/seed.test.ts
git commit -m "feat: add app shell, navigation, and starter-menu seed"
```

---

### Task 8: Register screen (order taking + payment + save)

**Files:**
- Create: `src/ui/RegisterScreen.tsx`
- Modify: `src/App.tsx` (replace register stub)
- Test: `src/ui/RegisterScreen.test.tsx`

**Interfaces:**
- Consumes: `listCategories`, `listItemsByCategory`, `saveOrder` from `@/db/repo`; `addItem`, `setQty`, `cartTotalCents`, `changeDueCents` from `@/domain/cart`; `formatCents` from `@/domain/money`; `Category`, `Item`, `OrderLine` types.
- Produces: `<RegisterScreen />` — category tabs, item grid, cart with qty steppers + remove, total, and a charge flow (choose Cash/Card → confirm → save → cart clears). Exposes no props.

- [ ] **Step 1: Write the failing test**

Create `src/ui/RegisterScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "@/db/database";
import { addCategory, addItem, listOrders } from "@/db/repo";
import RegisterScreen from "./RegisterScreen";

beforeEach(async () => {
  await db.delete();
  await db.open();
  const cat = await addCategory("Espresso");
  await addItem({ name: "Latte", priceCents: 450, categoryId: cat.id });
});

describe("RegisterScreen", () => {
  it("adds an item to the cart and shows the total", async () => {
    const user = userEvent.setup();
    render(<RegisterScreen />);
    await user.click(await screen.findByRole("button", { name: /Latte/ }));
    expect(await screen.findByText("$4.50")).toBeInTheDocument();
  });

  it("disables charge when the cart is empty", async () => {
    render(<RegisterScreen />);
    const charge = await screen.findByRole("button", { name: /charge/i });
    expect(charge).toBeDisabled();
  });

  it("completes a cash order and clears the cart", async () => {
    const user = userEvent.setup();
    render(<RegisterScreen />);
    await user.click(await screen.findByRole("button", { name: /Latte/ }));
    await user.click(screen.getByRole("button", { name: /charge/i }));
    await user.click(await screen.findByRole("button", { name: /^cash$/i }));
    await user.click(await screen.findByRole("button", { name: /complete/i }));

    await waitFor(async () => {
      expect(await listOrders()).toHaveLength(1);
    });
    const orders = await listOrders();
    expect(orders[0].totalCents).toBe(450);
    expect(orders[0].paymentMethod).toBe("cash");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- RegisterScreen`
Expected: FAIL — cannot find module `./RegisterScreen`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/RegisterScreen.tsx`:

```tsx
import { useEffect, useState } from "react";
import type { Category, Item, OrderLine } from "@/domain/types";
import { listCategories, listItemsByCategory, saveOrder } from "@/db/repo";
import { addItem as addToCart, setQty, cartTotalCents } from "@/domain/cart";
import { formatCents } from "@/domain/money";

export default function RegisterScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    listCategories().then((cats) => {
      setCategories(cats);
      if (cats[0]) setActiveCat(cats[0].id);
    });
  }, []);

  useEffect(() => {
    if (activeCat) listItemsByCategory(activeCat).then(setItems);
  }, [activeCat]);

  const total = cartTotalCents(cart);

  async function complete(method: "cash" | "card") {
    await saveOrder({ lineItems: cart, totalCents: total, paymentMethod: method });
    setCart([]);
    setPaying(false);
  }

  return (
    <div>
      <div role="tablist">
        {categories.map((c) => (
          <button key={c.id} aria-selected={c.id === activeCat} onClick={() => setActiveCat(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div>
        {items.map((item) => (
          <button key={item.id} onClick={() => setCart((c) => addToCart(c, item))}>
            {item.name} {formatCents(item.priceCents)}
          </button>
        ))}
      </div>

      <ul>
        {cart.map((line) => (
          <li key={line.itemId}>
            {line.nameSnapshot} × {line.qty} = {formatCents(line.priceCentsSnapshot * line.qty)}
            <button aria-label={`decrease ${line.nameSnapshot}`} onClick={() => setCart((c) => setQty(c, line.itemId, line.qty - 1))}>−</button>
            <button aria-label={`increase ${line.nameSnapshot}`} onClick={() => setCart((c) => setQty(c, line.itemId, line.qty + 1))}>+</button>
            <button aria-label={`remove ${line.nameSnapshot}`} onClick={() => setCart((c) => setQty(c, line.itemId, 0))}>×</button>
          </li>
        ))}
      </ul>

      <p>Total: {formatCents(total)}</p>
      <button onClick={() => setPaying(true)} disabled={cart.length === 0}>Charge</button>

      {paying && (
        <PaymentPanel total={total} onPay={complete} onCancel={() => setPaying(false)} />
      )}
    </div>
  );
}

function PaymentPanel({
  total,
  onPay,
  onCancel,
}: {
  total: number;
  onPay: (method: "cash" | "card") => void;
  onCancel: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "card" | null>(null);
  const [tendered, setTendered] = useState("");

  const tenderedCents = Math.round(parseFloat(tendered || "0") * 100);
  const change = tenderedCents >= total ? tenderedCents - total : null;

  return (
    <div role="dialog" aria-label="Payment">
      <p>Amount due: {formatCents(total)}</p>
      <button onClick={() => setMethod("cash")} aria-pressed={method === "cash"}>Cash</button>
      <button onClick={() => setMethod("card")} aria-pressed={method === "card"}>Card</button>

      {method === "cash" && (
        <div>
          <label>
            Amount tendered
            <input value={tendered} onChange={(e) => setTendered(e.target.value)} inputMode="decimal" />
          </label>
          {change !== null && <p>Change due: {formatCents(change)}</p>}
        </div>
      )}

      <button onClick={() => method && onPay(method)} disabled={!method}>Complete</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
```

- [ ] **Step 4: Wire it into App**

In `src/App.tsx`, add `import RegisterScreen from "./ui/RegisterScreen";` and replace `{screen === "register" && <p>Register screen</p>}` with `{screen === "register" && <RegisterScreen />}`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- RegisterScreen`
Expected: PASS — all three RegisterScreen tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/RegisterScreen.tsx src/ui/RegisterScreen.test.tsx src/App.tsx
git commit -m "feat: add register screen with order taking and payment"
```

---

### Task 9: Menu settings screen

**Files:**
- Create: `src/ui/MenuScreen.tsx`
- Modify: `src/App.tsx` (replace menu stub)
- Test: `src/ui/MenuScreen.test.tsx`

**Interfaces:**
- Consumes: `listCategories`, `addCategory`, `deleteCategory`, `countItemsInCategory`, `listItems`, `addItem`, `deleteItem` from `@/db/repo`; `parseDollarsToCents`, `formatCents` from `@/domain/money`.
- Produces: `<MenuScreen />` — add a category; within a category, add items (name + price), list items, delete item; delete a category (confirm if it has items).

- [ ] **Step 1: Write the failing test**

Create `src/ui/MenuScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "@/db/database";
import { addCategory } from "@/db/repo";
import MenuScreen from "./MenuScreen";

beforeEach(async () => {
  await db.delete();
  await db.open();
  await addCategory("Espresso");
});

describe("MenuScreen", () => {
  it("adds an item with a parsed price", async () => {
    const user = userEvent.setup();
    render(<MenuScreen />);
    await user.type(await screen.findByLabelText(/item name/i), "Latte");
    await user.type(screen.getByLabelText(/price/i), "4.50");
    await user.click(screen.getByRole("button", { name: /add item/i }));
    expect(await screen.findByText(/Latte/)).toBeInTheDocument();
    expect(await screen.findByText("$4.50")).toBeInTheDocument();
  });

  it("rejects an invalid price without adding", async () => {
    const user = userEvent.setup();
    render(<MenuScreen />);
    await user.type(await screen.findByLabelText(/item name/i), "Bad");
    await user.type(screen.getByLabelText(/price/i), "abc");
    await user.click(screen.getByRole("button", { name: /add item/i }));
    expect(await screen.findByText(/invalid price/i)).toBeInTheDocument();
    expect(screen.queryByText("Bad")).not.toBeInTheDocument();
  });

  it("adds a new category", async () => {
    const user = userEvent.setup();
    render(<MenuScreen />);
    await user.type(await screen.findByLabelText(/category name/i), "Tea");
    await user.click(screen.getByRole("button", { name: /add category/i }));
    await waitFor(() => expect(screen.getByText("Tea")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- MenuScreen`
Expected: FAIL — cannot find module `./MenuScreen`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/MenuScreen.tsx`:

```tsx
import { useEffect, useState } from "react";
import type { Category, Item } from "@/domain/types";
import {
  listCategories, addCategory, deleteCategory, countItemsInCategory,
  listItems, addItem, deleteItem,
} from "@/db/repo";
import { parseDollarsToCents, formatCents } from "@/domain/money";

export default function MenuScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [newCat, setNewCat] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const cats = await listCategories();
    setCategories(cats);
    setItems(await listItems());
    if (!activeCat && cats[0]) setActiveCat(cats[0].id);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAddCategory() {
    if (!newCat.trim()) return;
    const cat = await addCategory(newCat.trim());
    setNewCat("");
    setActiveCat(cat.id);
    await refresh();
  }

  async function handleDeleteCategory(id: string) {
    const count = await countItemsInCategory(id);
    if (count > 0 && !confirm(`This category has ${count} item(s). Delete anyway?`)) return;
    await deleteCategory(id);
    if (activeCat === id) setActiveCat(null);
    await refresh();
  }

  async function handleAddItem() {
    if (!activeCat || !itemName.trim()) return;
    let priceCents: number;
    try {
      priceCents = parseDollarsToCents(itemPrice);
    } catch {
      setError("Invalid price");
      return;
    }
    setError("");
    await addItem({ name: itemName.trim(), priceCents, categoryId: activeCat });
    setItemName("");
    setItemPrice("");
    await refresh();
  }

  return (
    <div>
      <section>
        <h2>Categories</h2>
        <label>
          Category name
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} />
        </label>
        <button onClick={handleAddCategory}>Add category</button>
        <ul>
          {categories.map((c) => (
            <li key={c.id}>
              <button aria-selected={c.id === activeCat} onClick={() => setActiveCat(c.id)}>{c.name}</button>
              <button aria-label={`delete ${c.name}`} onClick={() => handleDeleteCategory(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Items</h2>
        <label>
          Item name
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} />
        </label>
        <label>
          Price
          <input value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} inputMode="decimal" />
        </label>
        <button onClick={handleAddItem}>Add item</button>
        {error && <p role="alert">{error}</p>}
        <ul>
          {items
            .filter((i) => i.categoryId === activeCat)
            .map((i) => (
              <li key={i.id}>
                {i.name} {formatCents(i.priceCents)}
                <button aria-label={`delete ${i.name}`} onClick={async () => { await deleteItem(i.id); await refresh(); }}>Delete</button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Wire it into App**

In `src/App.tsx`, add `import MenuScreen from "./ui/MenuScreen";` and replace `{screen === "menu" && <p>Menu screen</p>}` with `{screen === "menu" && <MenuScreen />}`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- MenuScreen`
Expected: PASS — all MenuScreen tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/MenuScreen.tsx src/ui/MenuScreen.test.tsx src/App.tsx
git commit -m "feat: add menu settings screen"
```

---

### Task 10: Reports screen (daily summary + void)

**Files:**
- Create: `src/ui/ReportsScreen.tsx`
- Modify: `src/App.tsx` (replace reports stub)
- Test: `src/ui/ReportsScreen.test.tsx`

**Interfaces:**
- Consumes: `listOrders`, `voidOrder` from `@/db/repo`; `ordersForDay`, `summarize` from `@/domain/report`; `formatCents` from `@/domain/money`; `dayRange` not needed directly.
- Produces: `<ReportsScreen />` — a date input (defaults to today), summary block (total, order count, cash/card split, voided count), per-item breakdown, and a list of the day's orders each with a Void button (confirm before voiding; voided orders shown marked).

- [ ] **Step 1: Write the failing test**

Create `src/ui/ReportsScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "@/db/database";
import { saveOrder } from "@/db/repo";
import ReportsScreen from "./ReportsScreen";

beforeEach(async () => {
  await db.delete();
  await db.open();
  await saveOrder({
    lineItems: [{ itemId: "i1", nameSnapshot: "Latte", priceCentsSnapshot: 450, qty: 1 }],
    totalCents: 450,
    paymentMethod: "cash",
  });
});

describe("ReportsScreen", () => {
  it("shows today's total for a completed order", async () => {
    render(<ReportsScreen />);
    expect(await screen.findByText(/Total:\s*\$4\.50/)).toBeInTheDocument();
  });

  it("voids an order and drops it from the total", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<ReportsScreen />);
    await user.click(await screen.findByRole("button", { name: /void/i }));
    await waitFor(() =>
      expect(screen.getByText(/Total:\s*\$0\.00/)).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ReportsScreen`
Expected: FAIL — cannot find module `./ReportsScreen`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/ReportsScreen.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import type { Order } from "@/domain/types";
import { listOrders, voidOrder } from "@/db/repo";
import { ordersForDay, summarize } from "@/domain/report";
import { formatCents } from "@/domain/money";

function todayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ReportsScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateValue, setDateValue] = useState(todayInputValue());

  async function refresh() {
    setOrders(await listOrders());
  }

  useEffect(() => {
    refresh();
  }, []);

  const selectedDate = useMemo(() => {
    const [y, m, d] = dateValue.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [dateValue]);

  const dayOrders = ordersForDay(orders, selectedDate);
  const summary = summarize(dayOrders);

  async function handleVoid(id: string) {
    if (!confirm("Void this order? This cannot be undone.")) return;
    await voidOrder(id);
    await refresh();
  }

  return (
    <div>
      <label>
        Date
        <input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
      </label>

      <section>
        <p>Total: {formatCents(summary.totalCents)}</p>
        <p>Orders: {summary.orderCount}</p>
        <p>Cash: {formatCents(summary.cashCents)} · Card: {formatCents(summary.cardCents)}</p>
        <p>Voided: {summary.voidedCount}</p>
      </section>

      <section>
        <h3>Items</h3>
        <ul>
          {summary.itemBreakdown.map((b) => (
            <li key={b.name}>{b.name} × {b.qty} = {formatCents(b.totalCents)}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Orders</h3>
        <ul>
          {dayOrders.map((o) => (
            <li key={o.id}>
              {formatCents(o.totalCents)} · {o.paymentMethod}
              {o.status === "voided" ? (
                <span> — VOIDED</span>
              ) : (
                <button onClick={() => handleVoid(o.id)}>Void</button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Wire it into App**

In `src/App.tsx`, add `import ReportsScreen from "./ui/ReportsScreen";` and replace `{screen === "reports" && <p>Reports screen</p>}` with `{screen === "reports" && <ReportsScreen />}`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- ReportsScreen`
Expected: PASS — both ReportsScreen tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/ReportsScreen.tsx src/ui/ReportsScreen.test.tsx src/App.tsx
git commit -m "feat: add reports screen with daily summary and void"
```

---

### Task 11: Backup screen

**Files:**
- Create: `src/ui/BackupScreen.tsx`
- Modify: `src/App.tsx` (replace backup stub)
- Test: `src/ui/BackupScreen.test.tsx`

**Interfaces:**
- Consumes: `downloadBackup`, `restoreFromFile` from `@/db/backup`.
- Produces: `<BackupScreen />` — an Export button (calls `downloadBackup`) and a file input that restores via `restoreFromFile`, showing a confirmation warning before importing and a success/error message after.

- [ ] **Step 1: Write the failing test**

Create `src/ui/BackupScreen.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const downloadBackup = vi.fn().mockResolvedValue(undefined);
const restoreFromFile = vi.fn().mockResolvedValue(undefined);
vi.mock("@/db/backup", () => ({ downloadBackup, restoreFromFile }));

import BackupScreen from "./BackupScreen";

beforeEach(() => {
  downloadBackup.mockClear();
  restoreFromFile.mockClear();
});

describe("BackupScreen", () => {
  it("calls downloadBackup when Export is clicked", async () => {
    const user = userEvent.setup();
    render(<BackupScreen />);
    await user.click(screen.getByRole("button", { name: /export/i }));
    expect(downloadBackup).toHaveBeenCalledOnce();
  });

  it("restores from a selected file after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<BackupScreen />);
    const file = new File(['{"version":1}'], "backup.json", { type: "application/json" });
    await user.upload(screen.getByLabelText(/import/i), file);
    expect(restoreFromFile).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BackupScreen`
Expected: FAIL — cannot find module `./BackupScreen`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/BackupScreen.tsx`:

```tsx
import { useState, type ChangeEvent } from "react";
import { downloadBackup, restoreFromFile } from "@/db/backup";

export default function BackupScreen() {
  const [message, setMessage] = useState("");

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("Importing replaces ALL current data. Continue?")) return;
    try {
      await restoreFromFile(file);
      setMessage("Import successful.");
    } catch {
      setMessage("Import failed: invalid backup file.");
    }
  }

  return (
    <div>
      <button onClick={() => downloadBackup()}>Export backup</button>
      <label>
        Import backup
        <input type="file" accept="application/json" onChange={handleImport} />
      </label>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Wire it into App**

In `src/App.tsx`, add `import BackupScreen from "./ui/BackupScreen";` and replace `{screen === "backup" && <p>Backup screen</p>}` with `{screen === "backup" && <BackupScreen />}`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- BackupScreen`
Expected: PASS — both BackupScreen tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/BackupScreen.tsx src/ui/BackupScreen.test.tsx src/App.tsx
git commit -m "feat: add backup screen"
```

---

### Task 12: Final integration check and build

**Files:**
- Modify: none expected (fix-ups only if the build surfaces issues)

**Interfaces:**
- Consumes: everything.
- Produces: a passing full test suite and a successful production build.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all suites green (smoke, money, cart, report, repo, backup, seed, RegisterScreen, MenuScreen, ReportsScreen, BackupScreen).

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors; `dist/` is produced.

- [ ] **Step 3: Manual smoke (optional but recommended)**

Run: `npm run dev`, open the served URL, add items to the cart, charge as cash, then check Reports shows the sale and Backup exports a file.

- [ ] **Step 4: Commit any fix-ups**

```bash
git add -A
git commit -m "chore: final integration fixups and production build verification"
```

---

## Notes for the implementer

- Run each task's tests in isolation first (`npm test -- <name>`), then the full suite before committing.
- `beforeEach` deletes and reopens the Dexie DB so tests never share state.
- The UI styling is intentionally minimal here — visual design (per DESIGN.md aesthetic, or a coffee-shop-specific design system) is a separate pass after the functional app works end to end.
