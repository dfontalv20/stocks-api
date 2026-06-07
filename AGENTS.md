# AGENTS.md

## Stack
- NestJS 11 + TypeORM (Postgres) + `@nestjs/jwt` + `firebase-admin` + Finnhub REST/WS.
- pnpm (see `pnpm-workspace.yaml` — single package, but `allowBuilds` is whitelisted for native deps like `bcrypt`, `better-sqlite3`, `firebase`).
- TS: `module: nodenext`, target ES2023, `@/*` -> `src/*` (see `tsconfig.json` + `package.json` `jest.moduleNameMapper`).

## Commands
- `pnpm install` — install (uses `pnpm-workspace.yaml` allow-list for native builds).
- `pnpm run start:dev` — nest watch on port `process.env.PORT ?? 3000`.
- `pnpm run build` — `nest build`; `nest-cli.json` sets `deleteOutDir: true`, so `dist/` is wiped each build.
- `pnpm run lint` — ESLint with `--fix` over `src`, `apps`, `libs`, `test`.
- `pnpm run format` — Prettier write to `src/**/*.ts` and `test/**/*.ts`.
- `pnpm run typeorm` / `pnpm run migration:generate|run|revert|create` — all use `src/data-source.ts`.

## Test commands
There are two Jest configs and two kinds of tests; this is the most-missed thing in this repo:
- **Unit tests** (`pnpm test`): only matches `src/**/*.spec.ts` (NOT `.e2e.spec.ts`). `src/setupTests.ts` auto-mocks `ws` and `@/firebase/firebase.service` so unit tests can import the gateway and firebase service without hitting the network or Firebase.
- **E2E tests** (`pnpm test:e2e`): uses `./test/jest-e2e.json`; testRegex is `\.e2e-spec\.ts$`. The actual e2e specs live **next to the source in `src/`** (e.g. `src/alerts/alerts.e2e.spec.ts`), not in `test/`. The file at `test/app.e2e-spec.ts` is the leftover NestJS starter "Hello World!" spec and is not the pattern to follow.
- E2E tests share helpers `createTestApp()` (`src/utils/app.ts`) which overrides TypeORM to `dbOptionsSqlite` (better-sqlite3, `:memory:`, `synchronize: true`, `dropSchema: true`) and `createTestUser(app, { suffix?, fcmToken? })` (`src/utils/user.ts`) which returns a signed JWT.
- Single e2e file: `pnpm test:e2e -- src/alerts/alerts.e2e.spec.ts`. Single test: append `-t "should create an alert"`.

## Architecture
- `src/main.ts` boots `AppModule`, mounts Swagger at `/api` (YAML at `/api.yaml`), then `addAppConfig` (`src/utils/app.ts`) wires `ValidationPipe` + `ClassSerializerInterceptor`. `main.ts` also configures `WsAdapter` (`@nestjs/platform-ws`) for the WebSocket server; `addAppConfig` does NOT include it (adapter is production-only to keep tests simple).
- `AppModule` is the only place wiring cross-cutting modules: `ConfigModule.forRoot({ isGlobal: true })`, `EventEmitterModule.forRoot({ global: true })`, `TypeOrmModule.forRoot({ ...dbOptions, autoLoadEntities: true })`, and a global `JwtModule` (secret from `JWT_SECRET`, expiry from `JWT_EXPIRES_IN` default `'1h'`).
- Modules: `auth` (sign-up/in + `AuthGuard` + `User` entity), `stocks` (REST search via Finnhub + `StocksGateway` WS client), `alerts` (CRUD + trade event handler), `firebase` (FCM sender).
- `StocksGateway` opens a real `wss://ws.finnhub.io` connection in its constructor using `FINNHUB_API_KEY` and emits a `trade.update` event on every trade payload. It auto-reconnects on `close`/`error` with exponential backoff (1s → 30s cap, see `INITIAL_RECONNECT_DELAY_MS` / `MAX_RECONNECT_DELAY_MS` in `src/stocks/stocks.gateway.ts`); the `setupTests.ts` mock for `ws` does not simulate reconnects. It also runs as a WebSocket server (via `@nestjs/platform-ws` `WsAdapter` in `main.ts`) and broadcasts every trade payload to all connected WS clients. `AlertsController` uses `@OnEvent('trade.update')` to call `AlertsService.checkTrades`, which fires FCM via `FirebaseService.sendNotification` to users whose `fcmToken` is set and whose alert's stored `price` is below the incoming trade price.
- `AuthGuard` (`src/auth/auth.guard.ts`) extracts a `Bearer` token, verifies with `JwtService`, loads the `User`, and attaches it as `request['user']` (string-keyed, cast with `as User` in controllers — keep the cast pattern).

## Database
- Postgres at `DB_CONNECTION` (see `src/data-source.ts`). `synchronize: false`, `migrationsRun: false` — schema changes must go through a migration.
- Migrations live in `src/migrations/` (existing: create-user, create-alert, add-fcm-token). Generate with `pnpm migration:generate src/migrations/<Name>`, then `pnpm migration:run`.
- `dbOptionsSqlite` in the same file is e2e-only.

## Required env (`.env`)
- `DB_CONNECTION` — required at boot (also during typeorm CLI commands).
- `JWT_SECRET` — required (no default; `ConfigService.getOrThrow`).
- `JWT_EXPIRES_IN` — optional, default `'1h'` (`ms` `StringValue`).
- `FINNHUB_API_KEY` — required at boot for REST search and for `StocksGateway`.
- `FINNHUB_API_URL` — required at boot; REST base URL used as axios `baseURL` (default in `.env`: `https://finnhub.io/api/v1`). Endpoints compose as relative paths (e.g. `/search`, `/stock/recommendation`).
- `FINNHUB_WS_URL` — required at boot; WS base (default in `.env`: `wss://ws.finnhub.io`); `?token=…` is composed in code.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — required at boot for `FirebaseService`; the private key in `.env` has escaped `\n` and is read as a single string.

## Gotchas
- The `.env` file is gitignored at the root, but a populated one with real-looking secrets is currently committed — treat any committed secrets as leaked and rotate.
- `StocksGateway` connects on app boot; if `FINNHUB_API_KEY` is missing or the network is blocked, e2e tests that go through the full `AppModule` will hang at startup. The e2e pattern is to either use `createTestApp()` (no network call due to `ws` mock) or override the provider — see `src/stocks/stocks.e2e.spec.ts` for the `overrideProvider(StocksService).useValue(...)` pattern.
- `alerts.service.checkTrades` notifies when `alert.price < newPrice` (target reached from below). If the business rule ever changes, this is the spot.
- `tsconfig.json` has `noImplicitAny: false` and `strictNullChecks: true` only — don't assume full strict mode.
- ESLint runs typed rules (`recommendedTypeChecked`) and requires a real TS project; lint can fail on generated `dist/` if it isn't excluded (currently excluded by `tsconfig.build.json`'s exclude + the `eslint.config.mjs` `ignores`).
- `deleteOutDir: true` in `nest-cli.json` means running `nest build` always wipes `dist/`.
- Docker build uses `node:24-alpine` + `corepack enable` + `pnpm install --frozen-lockfile`; `pnpm prune --prod` runs after build to drop devDeps.
