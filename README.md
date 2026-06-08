# Stocks API

Real-time stock price alerting service built with **NestJS 11**, **TypeORM** (Postgres), and **Finnhub** market data. Users register, set price alerts on stock symbols, and receive Firebase Cloud Messaging (FCM) push notifications when trade prices cross their threshold. A WebSocket gateway streams live Finnhub trades to connected clients and drives the alert engine via NestJS event emitters.

---

## Prerequisites

- **Node.js** >= 24 (runtime; Alpine `node:24-alpine` in Docker)
- **pnpm** >= 11 (enable via `corepack enable`)
- **PostgreSQL** 15+ (or a managed Postgres URL)
- **(Optional) Docker** for containerised builds (see `Dockerfile`)

---

## Installation

```bash
git clone <repo-url>
cd stocks-api
pnpm install
```

> `pnpm-workspace.yaml` whitelists native builds (`bcrypt`, `better-sqlite3`, `firebase`, etc.) — no additional system dependencies required.

---

## Environment Variables

Copy the template below into `.env` (the file is gitignored; do not commit secrets).

```env
# -- Database
DB_CONNECTION=postgresql://user:pass@host:5432/db

# -- JWT
JWT_SECRET=CHANGE_ME
JWT_EXPIRES_IN=1h           # optional; ms StringValue format

# -- Finnhub (market data)
FINNHUB_API_KEY=your_key
FINNHUB_API_URL=https://finnhub.io/api/v1
FINNHUB_WS_URL=wss://ws.finnhub.io

# -- Firebase Admin (push notifications)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-file.json
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_CONNECTION` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | HMAC secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | `1h` | Token expiry (uses [`ms`](https://www.npmjs.com/package/ms) format) |
| `FINNHUB_API_KEY` | Yes | — | Finnhub API key (REST + WebSocket) |
| `FINNHUB_API_URL` | Yes | `https://finnhub.io/api/v1` | Finnhub REST base URL |
| `FINNHUB_WS_URL` | Yes | `wss://ws.finnhub.io` | Finnhub WebSocket endpoint |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | — | Path to Firebase service account JSON file |
| `PORT` | No | `3000` | HTTP server listen port |

---

## Running the App

```bash
# development (watch mode)
pnpm run start:dev

# production
pnpm run build
pnpm run start:prod
```

---

## Architecture & File Structure

```
src/
├── main.ts                       # Bootstrap: Swagger, WsAdapter, ValidationPipe
├── app.module.ts                 # Root module — global config, typeorm, jwt, event emitter
├── config.ts                     # addAppConfig — ValidationPipe + ClassSerializerInterceptor
├── data-source.ts                # TypeORM DataSource (Postgres + SQLite for e2e)
├── auth/                         # Authentication & user management
│   ├── auth.module.ts
│   ├── auth.controller.ts        # POST /auth/signUp, /auth/signIn, POST /auth/signOut, GET /auth/user
│   ├── auth.service.ts
│   ├── auth.guard.ts             # Bearer JWT guard (attaches user to request)
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── sign-in.dto.ts
│   └── entities/
│       └── user.entity.ts
├── alerts/                       # Price alert CRUD + trade event handler
│   ├── alerts.module.ts
│   ├── alerts.controller.ts      # POST/GET/DELETE /alerts + @OnEvent('trade.update')
│   ├── alerts.service.ts         # Check trades, notify via FCM
│   ├── dto/
│   │   └── create-alert.dto.ts
│   └── entities/
│       └── alert.entity.ts
├── stocks/                       # Finnhub REST search + WebSocket gateway
│   ├── stocks.module.ts
│   ├── stocks.controller.ts      # GET /stocks?search=..., GET /stocks/:symbol
│   ├── stocks.service.ts         # Finnhub HTTP client (axios)
│   ├── stocks.gateway.ts         # Finnhub WS client + nest WS server + trade.update emitter
│   └── dto/
│       └── get-stocks.dto.ts
├── firebase/                     # FCM push notification sender
│   ├── firebase.module.ts
│   └── firebase.service.ts
└── migrations/                   # TypeORM migration files (timestamp-prefixed)

test/
├── setupTests.ts                 # Auto-mocks ws and firebase for unit tests
├── alerts.e2e.spec.ts
├── auth.e2e.spec.ts
├── stocks.e2e.spec.ts
└── utils/
    ├── app.ts                    # createTestApp(), createTestModule()
    └── user.ts                   # createTestUser()
```

**Conventions:**
- **kebab-case** for all files (`alert.entity.ts`, `create-alert.dto.ts`, `auth.guard.ts`)
- **PascalCase** for classes, **camelCase** for methods/properties
- DTOs use `class-validator` decorators; entities use TypeORM decorators
- Controllers are thin — business logic lives in services
- Event-driven cross-module communication via `@nestjs/event-emitter`

---

## Testing

```bash
# unit tests (src/**/*.spec.ts)
pnpm test

# e2e tests (src/**/*.e2e-spec.ts)
pnpm test:e2e

# single e2e test file
pnpm test:e2e -- src/alerts/alerts.e2e.spec.ts

# single test (by name)
pnpm test:e2e -- src/alerts/alerts.e2e.spec.ts -t "should create an alert"
```

**Unit tests** auto-mock `ws` and `FirebaseService` via `test/setupTests.ts`.  
**E2E tests** override TypeORM with an in-memory SQLite database (`better-sqlite3`, `synchronize: true`, `dropSchema: true`) using the `createTestApp()` helper from `test/utils/app.ts`. E2E specs live in `test/` (e.g. `test/auth.e2e.spec.ts`).

---

## API Documentation

Interactive Swagger UI is available at `http://localhost:3000/api` (OpenAPI 3.0).  
A YAML export is served at `http://localhost:3000/api.yaml`.

All protected endpoints require a Bearer token obtained from `POST /auth/signIn`. Use the **Authorize** button in Swagger to set it globally.

---

## Database Migrations

Schema changes are managed via TypeORM migrations (Postgres only; e2e tests use `synchronize: true`).

```bash
# generate a migration from entity changes
pnpm migration:generate src/migrations/AddNewColumn

# run pending migrations
pnpm migration:run

# revert last migration
pnpm migration:revert

# create an empty migration file
pnpm migration:create src/migrations/MyCustomMigration
```

Migrations live in `src/migrations/` and are timestamp-prefixed.

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm run lint`
3. `pnpm test` (unit tests)
4. `pnpm run build`

Two secrets required in the CI environment: `JWT_SECRET` and `FINNHUB_WS_URL` (no real Finnhub key needed — `ws` is mocked in unit tests). The remaining env vars (`DB_CONNECTION`, `FINNHUB_API_KEY`, etc.) can be dummy values since unit tests neither hit the database nor the network.

Docker builds use a multi-stage `Dockerfile` (`node:24-alpine` → `pnpm install --frozen-lockfile` → `nest build` → `pnpm prune --prod`), exposing port `3000`.

---

## Data Flow

```
Finnhub WS ──► StocksGateway ──► trade.update event ──► AlertsController.handleTradeUpdate
                  │                                           │
                  ▼                                           ▼
            WS clients                                   AlertsService.checkTrades
                  │                                           │
                  ▼                                           ▼
            (broadcast)                                FirebaseService.sendNotification
```

- `StocksGateway` opens a real Finnhub WebSocket connection on boot and reconnects with exponential backoff (1s → 30s cap).
- Incoming trade payloads are emitted as `trade.update` events and broadcast to all connected WS clients.
- The alert engine checks whether any user's alert price is below the trade price for that symbol; matched alerts receive an FCM push and are marked `notifiedAt`.

---

## License

UNLICENSED — proprietary.
