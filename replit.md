# Onoot Boutique

A premium tech e-commerce platform specializing in phone accessories — cases, earphones, chargers, smartwatches, power banks, speakers, cables, and gadgets. Inspired by Jumia × Apple Store, built for African markets.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/onoot-boutique run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Framer Motion, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (users, products, categories, orders, reviews, carts)
- `lib/api-client-react/src/generated/` — generated React Query hooks + TypeScript types
- `lib/api-zod/src/generated/` — generated Zod schemas for server-side validation
- `artifacts/api-server/src/routes/` — Express route handlers (products, auth, cart, orders, reviews, admin)
- `artifacts/onoot-boutique/src/` — React frontend (pages, components, contexts)

## Architecture decisions

- Cart is session-based (UUID in localStorage) so guests can shop without logging in
- Auth uses a simple SHA-256 token scheme (base64 payload + signature); JWT replacement should be used in production
- Price fields stored as `numeric` in Postgres, converted to `float` in API responses
- Admin routes are protected by role check in the frontend (role === "admin"); backend doesn't enforce it yet — add middleware before production
- Codegen from OpenAPI spec produces typed hooks in `@workspace/api-client-react` and Zod schemas in `@workspace/api-zod`

## Product

- **Homepage**: Hero banner, featured products, categories grid, new arrivals, best sellers, on-sale products
- **Product catalog**: Filterable/searchable grid with category, brand, price range, rating, stock filters
- **Product detail**: Image gallery, stock indicator, color selector, add to cart, customer reviews
- **Cart**: Item management, quantity controls, real-time totals
- **Checkout**: Shipping form, payment selection (Paiement à la livraison, Orange Money, MTN Money, Moov Money, Carte bancaire)
- **Orders**: Order history, status timeline
- **Auth**: Register, login, profile management
- **Admin dashboard**: Revenue stats, order counts, top products, order management, user management

## Color palette (Tech Premium)

- Primary blue: `#1E3A8A`
- Dark accent: `#111827`
- Cyan (CTAs/buy): `#06B6D4`
- Background: `#F9FAFB`
- Discount badge: `#EF4444`
- In-stock: `#22C55E`
- Low stock: `#F97316`

## Admin credentials

- Email: `admin@onoot.com`
- Password: `admin123` (SHA-256 hashed)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml` before editing frontend code
- Price fields in the DB are `numeric` strings — always parse with `parseFloat()` before sending in API responses
- The `ilike` import from drizzle-orm is used for case-insensitive search — don't switch to `like`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
