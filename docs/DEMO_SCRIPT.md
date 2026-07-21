# Demo Script

## Goal

Demonstrate an MLBB-focused teammate matcher, marketplace listing flow, and mock escrow order lifecycle.

## Demo Accounts

- Admin: `admin@gamematcher.gg` / `Password123!`
- Seller: `seller@gamematcher.gg` / `Password123!`
- User: `user@gamematcher.gg` / `Password123!`

## Flow 1: MLBB Matchmaking

1. Login as `user@gamematcher.gg`.
2. Open **Squad Finder**.
3. Review filters:
   - Game: Mobile Legends: Bang Bang
   - Wanted role: Tank
   - Wanted lane: Roam
   - Language: Khmer or English
   - Availability: Weekday evenings
4. Explain that score includes rank, role, lane, region, language, mode, playstyle, availability, trust score, and activity.
5. Send a request to a suggested teammate.
6. If using seeded incoming request, accept it and open the generated private chat.

## Flow 2: Marketplace Checkout

1. Open **Marketplace**.
2. Filter by category, delivery time, seller rating, or mock escrow eligibility.
3. Open an MLBB listing, such as coaching or hero guide.
4. Add it to cart.
5. Open checkout.
6. Confirm that this is a mock escrow workflow only.
7. Create mock escrow order.
8. Show that the order status starts with `pending_payment` in history and current status becomes `escrow_secured`.

## Flow 3: Seller Delivery

1. Login as `seller@gamematcher.gg`.
2. Open **Seller** dashboard.
3. Show listing stats, escrow value, released revenue, and disputes.
4. For a secured order, click **Start delivery**.
5. Click **Mark delivered**.
6. Explain that these actions update order status history.

## Flow 4: Buyer Confirmation or Dispute

1. Login as `user@gamematcher.gg`.
2. Open **Orders**.
3. For a delivered order, click **Confirm delivery**.
4. Alternatively, enter a dispute reason and click **Open dispute**.
5. Explain that buyer confirmation does not release funds by itself in this demo; admin release is separate.

## Flow 5: Admin Resolution

1. Login as `admin@gamematcher.gg`.
2. Open **Admin** dashboard.
3. Show metrics for active escrow and disputed orders.
4. For a confirmed or delivered order, click **Release**.
5. For disputed orders, click **Resolve release** or **Resolve refund**.
6. Explain that this only changes database status for a practicum demo.

## Examiner Talking Points

- The original project already had matching, marketplace, auth, roles, and admin basics.
- The redesign adds MLBB-specific fields and workflows instead of replacing the stack.
- Escrow is intentionally mocked and clearly labeled.
- Route security separates buyer, seller, and admin actions.
- Tests verify auth, MLBB scoring, and escrow transitions.
