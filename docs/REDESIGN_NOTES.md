# Redesign Notes

## Evidence From Original Code

The original project already had:

- React/Vite frontend pages for landing, matcher, market, checkout, orders, seller, admin, profile, and chat.
- Express routes for auth, user profiles, matcher, chat, market, admin, games, and notifications.
- MongoDB models for users, games, match requests, matches, chat rooms, messages, products, carts, orders, reviews, reports, and notifications.
- Generic weighted matchmaking.
- Basic marketplace checkout with `paymentStatusMock` and `fulfillmentStatus`.
- Role middleware for user, seller, and admin pages.

The redesign keeps that evidence and improves it.

## UI Direction

The visual language was changed to a dark esports dashboard style inspired by Discord, Steam Marketplace, Epic Games, Riot-style esports surfaces, and MLBB competitive platforms.

Key UI changes:

- Smaller 6-8px radii for operational dashboard surfaces.
- Dark grid background and high contrast panels.
- Gold, cyan, green, red, and violet accents instead of a generic blue-only palette.
- Denser market and admin tables.
- Status badges for mock escrow states.
- Local MLBB-themed SVG assets for hero and product cards.

## Matchmaking Improvements

Original scoring considered:

- game
- rank proximity
- region
- language
- mode
- playstyle
- activity

New MLBB scoring adds:

- MLBB role
- MLBB lane
- availability
- trust score

The UI shows every score component so the recommendation is explainable.

## Marketplace Improvements

Listings now support:

- category
- service or digital product type
- delivery time
- delivery label
- escrow eligibility
- tags
- seller rating and trust score display

Filters now include:

- category
- listing type
- price range
- seller rating
- delivery time
- escrow eligibility

## Escrow Workflow Improvements

Orders now include:

- `escrowStatus`
- `statusHistory`
- `paymentMethodMock`
- `disputeReason`
- `resolutionNote`

Buyer actions:

- checkout with mock escrow
- confirm delivery
- open dispute
- cancel before delivery

Seller actions:

- start delivery
- mark delivered

Admin actions:

- release mock funds
- refund buyer
- resolve dispute

## Security and Validation Improvements

- Zod schemas validate MLBB enums, product data, status actions, dispute reasons, and resolution notes.
- Route middleware separates buyer, seller, and admin permissions.
- Sellers can only act on orders containing their own listings.
- Buyers can only act on their own orders.
- Admin release/refund/resolve actions require admin role.
- ObjectId inputs are validated in marketplace routes.
- Database indexes were added for user matching, product filters, orders, matches, and match requests.

## Limitations

- No real payment provider is connected.
- No real escrow account or regulated payment custody exists.
- No MLBB official API verification exists.
- Trust score is static demo data.
- Delivery proof is note/status based.
- Dispute evidence upload is not implemented.
