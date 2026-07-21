# MLBB Nexus: Game Matcher and Marketplace

MLBB Nexus is a full-stack university practicum project for a **Mobile Legends: Bang Bang Game Matcher and Marketplace Platform with Mock Escrow Workflow**.

The project keeps the original stack:

- Frontend: React, Vite, TypeScript, React Router, React Query
- Backend: Node.js, Express, TypeScript
- Database: MongoDB, Mongoose
- Real-time: Socket.IO chat
- Auth/security: JWT, bcryptjs, role middleware, Zod validation
- Testing: Vitest, Supertest, mongodb-memory-server

Important: the escrow workflow is a **mock demo only**. It does not hold, receive, release, or refund real money.

## What Changed

- Refocused the app on Mobile Legends: Bang Bang.
- Added MLBB profile fields: role, lane, availability, trust score.
- Updated matchmaking score to use rank, role, lane, language, region, mode, playstyle, availability, trust score, and activity.
- Added marketplace listing metadata: product/service type, category, delivery time, tags, escrow badge.
- Added mock escrow statuses and role-specific actions:
  - `pending_payment`
  - `escrow_secured`
  - `seller_delivering`
  - `delivered`
  - `buyer_confirmed`
  - `released_to_seller`
  - `disputed`
  - `refunded_to_buyer`
  - `cancelled`
- Added seller actions: start delivery, mark delivered.
- Added buyer actions: confirm delivery, open dispute, cancel before delivery, review.
- Added admin actions: release mock funds, refund buyer, resolve dispute.
- Improved seller and admin dashboards.
- Redesigned UI in a modern dark esports style.
- Added database indexes and stricter validation.
- Added backend tests for matchmaking, auth, and escrow flow.

## Monorepo Structure

```text
.
|-- client/
|   |-- public/images/products/
|   `-- src/
|       |-- api/
|       |-- components/
|       |-- context/
|       |-- pages/
|       |-- styles/
|       |-- mlbb.ts
|       |-- App.tsx
|       `-- main.tsx
|-- server/
|   |-- src/
|   |   |-- config/
|   |   |-- db/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- scripts/
|   |   |-- types/
|   |   `-- utils/
|   `-- tests/
|-- docs/
|-- .env.example
|-- package.json
`-- README.md
```

## Local Setup

See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for the full guide.

1. Install dependencies:

```powershell
npm.cmd install
```

2. Create `.env` in the repo root:

```env
VITE_API_URL=http://localhost:4000/api
CLIENT_URL=http://localhost:5173
SERVER_PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/mlbb-nexus
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

3. Start MongoDB locally.

4. Seed the database:

```powershell
npm.cmd run seed --workspace server
```

5. Run the app:

```powershell
npm.cmd run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:4000/api

## Demo Accounts

After seeding:

- Admin: `admin@gamematcher.gg` / `Password123!`
- Seller: `seller@gamematcher.gg` / `Password123!`
- User: `user@gamematcher.gg` / `Password123!`

## Demo Flow

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for a step-by-step script.

Short version:

1. Login as user.
2. Open Squad Finder and send or accept an MLBB match request.
3. Open Marketplace, add an MLBB listing to cart, and run mock escrow checkout.
4. Login as seller and mark the order as delivering and delivered.
5. Login as user and confirm delivery or open a dispute.
6. Login as admin and release mock funds, refund buyer, or resolve the dispute.

## Verification

Commands verified in this workspace:

```powershell
npm.cmd run build --workspace server
npm.cmd run test --workspace server
npm.cmd run build --workspace client
```

Full root build/test should also work after dependencies and MongoDB are available.

## Documentation

- [Setup Guide](docs/SETUP_GUIDE.md)
- [Demo Script](docs/DEMO_SCRIPT.md)
- [Redesign Notes](docs/REDESIGN_NOTES.md)
- [Project Report](docs/PROJECT_REPORT.md)

The project report includes Mermaid diagrams for architecture, ERD, matchmaking, marketplace, and escrow flow.

## Limitations

- Mock escrow is only a database workflow demo.
- No real payment provider is integrated.
- No real MLBB account verification is integrated.
- Trust score is a demo field, not a fraud detection model.
- Delivery proof is currently notes/status based; file upload evidence is a future improvement.
- The platform intentionally avoids account resale workflows.

## Future Improvements

- Real payment provider integration with legal escrow/compliance review.
- Stronger seller KYC and MLBB profile verification.
- Delivery evidence upload with admin review.
- Anti-spam/rate limiting for chat and requests.
- More granular dispute evidence and audit exports.
- Recommendation tuning based on accepted match outcomes.
