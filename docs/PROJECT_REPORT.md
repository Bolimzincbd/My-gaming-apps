# Project Report: MLBB Nexus

## Project Title

Mobile Legends: Bang Bang Game Matcher and Marketplace Platform with Mock Escrow Workflow

## Purpose

This project demonstrates a full-stack gaming platform focused on Mobile Legends: Bang Bang. It helps players find better teammates and lets users buy or sell MLBB-related services or digital products through a mock escrow workflow.

This is a university practicum demo. The escrow feature is not real payment escrow.

## Existing Project Evidence

The submitted code already contained:

- React/Vite frontend
- Express/TypeScript backend
- MongoDB/Mongoose database models
- JWT authentication
- User roles
- Marketplace products, cart, checkout, and orders
- Matchmaking, match requests, matches, and chat
- Seller and admin pages
- Seed data and tests

The redesign improved these existing parts instead of rewriting the project from zero.

## Main Features

### MLBB Matchmaking

Players can find teammates using:

- MLBB rank
- MLBB role
- MLBB lane
- language
- region
- playstyle
- availability
- trust score
- recent activity

### Marketplace

Users can browse MLBB listings with:

- categories
- seller rating
- trust score
- delivery time
- mock escrow badge
- product/service type
- filters and sorting

### Mock Escrow Workflow

The system supports these statuses:

- `pending_payment`
- `escrow_secured`
- `seller_delivering`
- `delivered`
- `buyer_confirmed`
- `released_to_seller`
- `disputed`
- `refunded_to_buyer`
- `cancelled`

## Demo Accounts

- Admin: `admin@gamematcher.gg` / `Password123!`
- Seller: `seller@gamematcher.gg` / `Password123!`
- User: `user@gamematcher.gg` / `Password123!`

## Architecture Diagram

```mermaid
flowchart LR
  User["Browser User"] --> React["React + Vite Client"]
  React --> API["Express API"]
  React --> Socket["Socket.IO Client"]
  API --> Mongo["MongoDB"]
  API --> Auth["JWT + Role Middleware"]
  API --> Zod["Zod Validation"]
  Socket --> IOServer["Socket.IO Server"]
  IOServer --> Mongo
  API --> Routes["Auth, Matcher, Market, Admin, Chat Routes"]
  Routes --> Models["Mongoose Models"]
```

## ERD Diagram

```mermaid
erDiagram
  USER ||--o{ MATCH_REQUEST : sends
  USER ||--o{ MATCH_REQUEST : receives
  USER ||--o{ MATCH : participates
  USER ||--o{ PRODUCT : sells
  USER ||--|| CART : owns
  USER ||--o{ ORDER : buys
  USER ||--o{ REVIEW : writes
  USER ||--o{ REPORT : submits
  USER ||--o{ NOTIFICATION : receives
  PRODUCT ||--o{ ORDER_ITEM : purchased_as
  ORDER ||--o{ ORDER_ITEM : contains
  ORDER ||--o{ STATUS_HISTORY : records
  MATCH ||--|| CHAT_ROOM : creates
  CHAT_ROOM ||--o{ MESSAGE : contains

  USER {
    string username
    string email
    string role
    string mlbbRole
    string mlbbLane
    string availability
    number trustScore
  }
  PRODUCT {
    string title
    string category
    string listingType
    number price
    number deliveryTimeHours
    boolean escrowEligible
  }
  ORDER {
    string escrowStatus
    string paymentStatusMock
    string fulfillmentStatus
    number total
  }
```

## Matchmaking Flow

```mermaid
flowchart TD
  A["User opens Squad Finder"] --> B["Selects MLBB filters"]
  B --> C["API loads candidates who play MLBB"]
  C --> D["Score rank proximity"]
  D --> E["Score role and lane fit"]
  E --> F["Score region, language, mode, playstyle"]
  F --> G["Score availability, trust, activity"]
  G --> H["Sort by total score"]
  H --> I["UI shows suggestions and score breakdown"]
  I --> J["User sends match request"]
  J --> K["Target accepts or declines"]
  K --> L["Accepted request creates match and chat room"]
```

## Marketplace Flow

```mermaid
flowchart TD
  A["Buyer opens Marketplace"] --> B["Filter by category, delivery, rating, escrow badge"]
  B --> C["Open MLBB listing"]
  C --> D["Add to cart"]
  D --> E["Mock escrow checkout"]
  E --> F["Order created"]
  F --> G["Seller notified"]
  G --> H["Seller dashboard handles delivery"]
```

## Escrow Flow

```mermaid
stateDiagram-v2
  [*] --> pending_payment
  pending_payment --> escrow_secured: mock checkout secures funds
  escrow_secured --> seller_delivering: seller starts delivery
  seller_delivering --> delivered: seller marks delivered
  escrow_secured --> delivered: seller marks delivered directly
  delivered --> buyer_confirmed: buyer confirms
  buyer_confirmed --> released_to_seller: admin releases
  delivered --> disputed: buyer disputes
  seller_delivering --> disputed: buyer disputes
  escrow_secured --> disputed: buyer disputes
  disputed --> released_to_seller: admin resolves release
  disputed --> refunded_to_buyer: admin resolves refund
  escrow_secured --> cancelled: buyer cancels before delivery
  escrow_secured --> refunded_to_buyer: admin refunds
```

## Security Review

The project improves security through:

- JWT protected routes
- role-based access control
- seller ownership checks on seller order actions
- buyer ownership checks on buyer order actions
- admin-only release/refund/dispute resolution
- Zod validation for request bodies
- ObjectId validation for marketplace route parameters
- MongoDB indexes for common query paths

## Limitations

- Mock escrow is not real escrow.
- No real payment gateway is connected.
- No regulated fund custody exists.
- Trust score is demo data.
- MLBB profile data is user-entered, not officially verified.
- Delivery proof upload is not implemented.

## Future Improvements

- Integrate a real payment provider after legal/compliance review.
- Add verified seller onboarding.
- Add delivery proof uploads.
- Add dispute evidence and admin audit export.
- Add rate limiting and abuse monitoring.
- Tune matchmaking with accepted match outcomes.
- Add official MLBB profile verification if an approved API is available.

## Final Explanation For Teacher

This project demonstrates how an existing game matcher and marketplace can be redesigned into an MLBB-specific platform. The technical focus is on practical full-stack engineering: schema design, API validation, route security, role-based workflows, UI redesign, seed data, and automated tests.

The mock escrow workflow is intentionally labeled as a simulation. It is valuable for a university project because it demonstrates order state management and role separation without pretending to be a real financial escrow system.
