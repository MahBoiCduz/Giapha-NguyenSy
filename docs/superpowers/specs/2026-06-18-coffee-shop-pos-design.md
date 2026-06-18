# Coffee Shop POS — Design (v1)

**Date:** 2026-06-18
**Status:** Approved (design); pending implementation plan

## 1. Purpose

A point-of-sale app for a single small coffee shop. A barista builds an order at
the counter, records payment, and the shop owner can review daily sales. Runs on
the shop's laptop/desktop in a browser, fully offline.

## 2. Scope

**In scope for v1**
- Take orders: browse menu by category, build a cart, total it.
- Record payment per order: Cash or Card (method + amount recorded only — no real
  card processing; the actual charge happens on a separate terminal).
- Refund/void: reverse a completed order (full-order void) so the till reconciles.
- Editable menu with categories (add/edit/remove categories and items + prices).
- Daily sales report with retained history (browse any past day).
- Backup: one-click Export to a file and Import to restore.

**Out of scope for v1** (future candidates)
- Real card processing (Stripe, etc.).
- Inventory tracking.
- Staff logins / roles.
- Multi-device / shared registers (needs a backend — see §8).
- Receipt printing.
- Partial refunds (v1 supports full-order void only).

## 3. Architecture (Approach A — client-only)

- **Stack:** React + TypeScript, built with Vite to static files. Opened from a
  browser bookmark on the shop laptop.
- **Persistence:** IndexedDB on that laptop (via a thin wrapper, e.g. Dexie). No
  server, no internet required.
- **Money:** stored and computed as integer **cents** everywhere to avoid floating
  point rounding errors. Formatting to currency happens only at display time.
- **Backup:** Export serializes all stores to a JSON file the user downloads;
  Import validates and restores it. This is the durability safety net for a
  single-browser data store.

### Code structure (separation for testability)
- `db/` — IndexedDB schema + typed data-access functions. No UI, no business rules.
  Kept cleanly separated, but not over-abstracted for a hypothetical future server.
- `domain/` — pure calculation logic (cart totals, change due, report aggregation,
  day-boundary logic). No DB, no UI. Heavily unit-tested.
- `ui/` — React screens and components. Calls `db/` and `domain/`.

## 4. Screens

1. **Register (home)**
   - Category tabs → grid of items in the selected category.
   - Tap an item to add it to the current cart; tapping again increments quantity.
   - Cart panel: line items with quantity steppers, per-line remove, live total.
   - "Charge" → payment step: choose Cash or Card, confirm amount.
     - Cash shows an optional "amount tendered → change due" helper.
   - Completing payment saves the order and clears the cart.
   - Empty cart cannot be charged.

2. **Menu settings**
   - Manage categories (name, sort order) and items (name, price, category, active).
   - Add / edit / remove. Prices constrained to non-negative.
   - Editing the menu never alters already-saved orders (see §5 snapshots).
   - Deleting a category that still contains items asks for confirmation.

3. **Reports**
   - Defaults to today. Date picker browses any past day (history retained).
   - Shows: total sales, order count, split by payment method, per-item breakdown.
   - Voided orders are excluded from totals (and shown separately/marked).

4. **Backup**
   - Export and Import buttons. Reminder of last export time.
   - Import validates the file shape before overwriting and warns that it replaces
     current data.

(Refund/void is initiated from a recent-orders view — e.g. within Reports for the
selected day — by selecting an order and confirming the void.)

## 5. Data model (IndexedDB stores)

- **categories**: `id`, `name`, `sortOrder`
- **items**: `id`, `name`, `priceCents`, `categoryId`, `active`
- **orders**: `id`, `timestamp`, `lineItems[]`, `totalCents`, `paymentMethod`
  (`"cash" | "card"`), `status` (`"completed" | "voided"`), `voidedAt?`
  - `lineItems[]` entries: `{ itemId, nameSnapshot, priceCentsSnapshot, qty }`
  - Orders store **snapshots** of item name and price so historical reports stay
    accurate even after the menu is edited.

Reports are derived on the fly by querying `orders` within a day's local-time range
and aggregating; voided orders are subtracted out.

## 6. Refund / void behavior

- A completed order can be voided in full. It remains in history with
  `status = "voided"` and a `voidedAt` timestamp.
- Reports exclude voided orders from sales totals so the day reconciles.
- Partial refunds are explicitly out of scope for v1.

## 7. Error & edge handling

- Empty cart cannot be charged.
- Deleting a category containing items requires confirmation.
- Import validates structure before replacing data and warns the user.
- Prices are non-negative.
- Day boundaries use the laptop's local time; report queries cover local midnight
  to midnight.

## 8. Multi-device (future)

True multi-device needs shared state, which requires a backend (local Node + SQLite
over wifi, or cloud). Not in v1. The `db/` layer is kept cleanly separated so a
future migration to a networked store is contained, without over-investing in
abstraction now.

## 9. Testing

- TDD throughout.
- Unit tests on `domain/`: cart totals, change-due calculation, report aggregation,
  void reconciliation, day-boundary logic.
- Tests on `db/` data-access functions.
- A few component tests covering the register → charge → saved-order flow.
