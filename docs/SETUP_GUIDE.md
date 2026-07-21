# Setup Guide

This project uses a **mock escrow** workflow for a university practicum demo. It does not connect to a real payment provider and does not hold, release, or refund real money.

## Prerequisites

- Node.js 22 or newer
- MongoDB running locally
- PowerShell on Windows

## Install

```powershell
npm.cmd install
```

## Environment

Create `.env` in the repository root:

```env
VITE_API_URL=http://localhost:4000/api
CLIENT_URL=http://localhost:5173
SERVER_PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/mlbb-nexus
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

## Seed Database

Start MongoDB first, then run:

```powershell
npm.cmd run seed --workspace server
```

The seed creates MLBB users, match requests, chat, products, cart data, released orders, disputed orders, reviews, reports, and notifications.

## Run Development Servers

```powershell
npm.cmd run dev
```

This starts:

- Backend API: http://localhost:4000/api
- Frontend: http://localhost:5173

You can also run them separately:

```powershell
npm.cmd run dev --workspace server
npm.cmd run dev --workspace client
```

## Build

```powershell
npm.cmd run build
```

## Test

```powershell
npm.cmd run test
```

## Demo Accounts

- Admin: `admin@gamematcher.gg` / `Password123!`
- Seller: `seller@gamematcher.gg` / `Password123!`
- User: `user@gamematcher.gg` / `Password123!`

## Troubleshooting

- If seed fails with `ECONNREFUSED`, MongoDB is not running.
- If frontend cannot call the API, confirm `VITE_API_URL` points to `http://localhost:4000/api`.
- If protected pages redirect to login, clear local storage and login again.
