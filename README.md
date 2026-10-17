# GoPratle: Event Requirement Posting

A four-step flow for posting an event requirement and saving it to MongoDB. The
requirement is for one of three categories: **Event Planner**, **Performer** or **Crew**.

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, React Hook Form, Zod
- **Backend:** Node.js, Express 5, TypeScript, Mongoose 9, Zod
- **Database:** MongoDB (Atlas in production)
- **Deployment targets:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

---

## Features

### Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page: hero ("Find the Right People for Your Event"), service cards for each category, How it works, benefits, and a closing call to action |
| `/post-requirement` | The four-step requirement form. `?category=planner\|performer\|crew` preselects a category (used by the service cards) |
| `/requirements` | Look up a requirement by its ID |
| `/requirements/[id]` | Read-only view of a saved requirement (via `GET /api/requirements/:id`) |

Shared navbar (with a mobile menu) and footer on every page. Every link points to a real page or section, and the e2e suite checks this.

### The four-step form

| Step | What the user does |
| --- | --- |
| 1. Event Basics | Event name, event type, single date or date range, location, optional venue, and category (Event Planner / Performer / Crew) |
| 2. Category Requirements | **Planner:** services, guest count, planning scope · **Performer:** type, genre/style, individual or group (+ group size), duration · **Crew:** roles, number of people, experience level, skills |
| 3. Additional Details | **Planner:** budget, timeline, additional services, preferences · **Performer:** budget, sound/lighting/equipment, preferences, instructions · **Crew:** pay range + basis, shift duration, working hours, equipment, instructions |
| 4. Review & Submit | Grouped summary with an **Edit** button per section; submits to the API and shows a success screen with the requirement ID (copyable), category, key event details and a link to the saved record |

Steps 2–4 show a "Requirement for …" banner with a **Change** button so the selected category is always visible.
If Continue is pressed with problems, an error summary shows how many fields need fixing and focus moves to the first one.

Quality details:

- Each step is validated by the **same Zod schema the server uses**. Errors show under each field, focus moves to the first invalid field, and errors clear live as the user fixes them.
- Date rules: the event date can't be in the past or more than 3 years ahead, impossible dates (e.g. 30 Feb) are rejected, and the end date can't be before the start date.
- Cross-field rules: a group performance needs a group size; crew must have at least as many people as selected roles; max budget/pay ≥ min.
- **No data loss:** one form state across all steps. Each category keeps its own answers, so switching category and back loses nothing. The draft is autosaved to `localStorage` and restored after a refresh.
- **Duplicate-safe submission:** the button is disabled with a spinner, an in-flight guard ignores extra clicks and Enter presses, and an `Idempotency-Key` header makes retries server-safe. A retry after a lost response returns the original record instead of creating a second one.
- **Honest success:** the success screen is shown only after the API confirms persistence (201, or 200 for a replayed retry) and the response matches the expected contract.
- Clear error states for: API URL not configured, backend unreachable, timeout, database down (503), server validation errors (mapped back to the right field and step), and malformed responses.
- Responsive layout: full stepper on desktop, compact "Step X of 4" progress bar on mobile. Accessible labels, `aria-invalid`/`aria-describedby`, keyboard-friendly chips.
- `/requirements/[id]` page that reads a saved requirement back through `GET /api/requirements/:id`.

---

## Project structure

```
gopratle-requirements/
├── backend/                         Express API (deploy to Render)
│   ├── src/
│   │   ├── index.ts                 bootstrap: env, HTTP server, DB connect w/ retry, graceful shutdown
│   │   ├── app.ts                   Express app: helmet, CORS, JSON parser, routes, error handling
│   │   ├── config/env.ts            validated environment variables
│   │   ├── config/db.ts             Mongoose connection helpers
│   │   ├── routes/                  health.routes.ts, requirement.routes.ts
│   │   ├── controllers/             health.controller.ts, requirement.controller.ts
│   │   ├── models/Requirement.ts    Mongoose model + one discriminator per category
│   │   ├── validation/requirement.schema.ts   ← shared Zod schema (source of truth)
│   │   ├── middleware/              validateBody, requireDatabase, errorHandler (+ 404)
│   │   └── utils/ApiError.ts
│   ├── scripts/                     db:memory (local MongoDB), db:check (Atlas check), e2e server
│   ├── tests/                       Vitest + Supertest + in-memory MongoDB
│   └── .env.example
├── frontend/                        Next.js app (deploy to Vercel)
│   ├── src/app/                     page.tsx (landing), post-requirement/ (wizard), requirements/ (lookup + [id] record), layout
│   ├── src/components/              SiteHeader, SiteFooter, Logo, icons (inline SVG set), categoryMeta, RequirementSummary
│   ├── src/components/wizard/       RequirementWizard, Stepper, step components, SuccessScreen
│   ├── src/components/form|ui/      RHF-bound fields, chips, tag input, buttons, alerts
│   ├── src/lib/                     api.ts (client), form.ts, draft.ts, summary.ts, format.ts,
│   │                                requirement.schema.ts (mirror of the backend schema)
│   ├── tests/unit/                  Vitest unit tests
│   ├── tests/e2e/                   Playwright browser tests (real API + MongoDB)
│   └── .env.example
├── render.yaml                      Render blueprint for the API
└── package.json                     repo-level helper scripts (sync:schema, check)
```

---

## Architecture and data flow

```
 Browser (Next.js on Vercel)                       Express API (Render)                    MongoDB Atlas
 ───────────────────────────                       ────────────────────                    ─────────────
 Step 1-3: React Hook Form                         POST /api/requirements
   └ zodResolver(step schema) ── shared Zod ──┐      ├ helmet, CORS (FRONTEND_URL only)
 Step 4: buildPayload() → full schema check    │      ├ express.json (100 kB limit)
   └ fetch(NEXT_PUBLIC_API_URL + /api/...) ────┼────▶ ├ validateBody(requirementPayloadSchema)  ← same schema
        headers: Idempotency-Key               │      ├ requireDatabase → 503 if disconnected
                                               │      ├ controller: replay by key or create
                                               │      │    via category discriminator model ─────▶ requirements
 Success screen ◀── 201 { success, data } ◀────┘      └ errorHandler → { success:false, error }        collection
 /requirements/[id] ── GET /api/requirements/:id ───────────────────────────────────────────────▶
```

**One schema, two layers.** `backend/src/validation/requirement.schema.ts` holds every
enum, display label, limit and rule. `frontend/src/lib/requirement.schema.ts` is a
byte-identical copy, and the backend test `schema-sync.test.ts` fails if they drift.
After editing the backend copy, run `npm run sync:schema` from the repo root.

**Storage.** Each document is
`{ eventBasics, category, categoryDetails: { requirements, additional }, createdAt, updatedAt }`.
`category` is the Mongoose discriminator key, so it's stored explicitly on every document,
and each category has its own strict, typed `categoryDetails` sub-schema (planner, performer
or crew). All categories share one `requirements` collection with an index on `category`.
Dates are stored as BSON `Date` (UTC midnight) and returned as `YYYY-MM-DD`.

---

## API

Base URL: `http://localhost:4000` locally, `https://<service>.onrender.com` in production.
Every response is JSON in one of two envelopes:

```jsonc
{ "success": true,  "data": { ... }, "meta": { ... } }                          // meta only on replays
{ "success": false, "error": { "code": "…", "message": "…", "details": [ { "path": "…", "message": "…" } ] } }
```

| Method & path | Success | Errors |
| --- | --- | --- |
| `GET /api/health` | `200` `{ status: "ok", database: "connected", uptimeSeconds, timestamp }` | `503` with `status: "degraded"` when MongoDB is not connected |
| `POST /api/requirements` | `201` + `Location` header, saved record · `200` + `meta.replayed: true` when the same `Idempotency-Key` is retried | `400 VALIDATION_ERROR` (with `details`), `400 INVALID_JSON`, `400 INVALID_IDEMPOTENCY_KEY`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `503 DATABASE_UNAVAILABLE`, `500 INTERNAL_ERROR` |
| `GET /api/requirements/:id` | `200` saved record | `400 INVALID_ID` (not a 24-char hex ObjectId), `404 REQUIREMENT_NOT_FOUND`, `503 DATABASE_UNAVAILABLE` |

Unknown routes return `404 NOT_FOUND`. Stack traces, Mongo error text and connection details are never sent to clients.

### Sample request

```bash
curl -X POST http://localhost:4000/api/requirements \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 4a9f3b52-1d7e-4c8a-9b1e-2f6d7c8e9a01" \
  -d '{
    "eventBasics": {
      "eventName": "Annual Day Gala",
      "eventType": "corporate",
      "dateMode": "single",
      "startDate": "2026-12-12",
      "location": "Mumbai, Maharashtra",
      "venueName": "NSCI Dome"
    },
    "category": "performer",
    "categoryDetails": {
      "requirements": {
        "performerType": "band",
        "genreOrStyle": "Bollywood retro",
        "format": "group",
        "groupSize": 5,
        "durationMinutes": 120
      },
      "additional": {
        "budget": { "min": 80000, "max": 150000 },
        "equipmentNeeds": ["sound_system", "stage_lighting"],
        "specialInstructions": "Arrive 2 hours early for sound check"
      }
    }
  }'
```

### Sample response: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "6ad379fb272a89e05ec4e996",
    "eventBasics": {
      "eventName": "Annual Day Gala",
      "eventType": "corporate",
      "dateMode": "single",
      "startDate": "2026-12-12",
      "location": "Mumbai, Maharashtra",
      "venueName": "NSCI Dome"
    },
    "category": "performer",
    "categoryDetails": {
      "requirements": { "performerType": "band", "genreOrStyle": "Bollywood retro", "format": "group", "groupSize": 5, "durationMinutes": 120 },
      "additional": { "budget": { "min": 80000, "max": 150000 }, "equipmentNeeds": ["sound_system", "stage_lighting"], "specialInstructions": "Arrive 2 hours early for sound check" }
    },
    "createdAt": "2026-10-17T13:36:59.123Z",
    "updatedAt": "2026-10-17T13:36:59.123Z"
  }
}
```

### Sample validation error: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload is invalid",
    "details": [
      { "path": "eventBasics.endDate", "message": "End date cannot be before the start date" },
      { "path": "categoryDetails.requirements.groupSize", "message": "Group size is required for a group" }
    ]
  }
}
```

### Field reference (enum values)

| Field | Allowed values |
| --- | --- |
| `category` | `planner`, `performer`, `crew` |
| `eventBasics.eventType` | `wedding`, `corporate`, `birthday`, `concert`, `festival`, `conference`, `private_party`, `other` |
| `eventBasics.dateMode` | `single` (no `endDate`), `range` (`endDate` ≥ `startDate`) |
| Planner `servicesRequired` | `venue_sourcing`, `vendor_management`, `decor_design`, `catering_coordination`, `guest_management`, `logistics`, `entertainment_booking`, `day_of_coordination` |
| Planner `planningScope` | `full_planning`, `partial_planning`, `day_of_coordination`, `consultation` |
| Planner `planningTimeline` | `under_1_month`, `1_to_3_months`, `3_to_6_months`, `over_6_months` |
| Performer `performerType` | `singer`, `band`, `dj`, `dancer`, `instrumentalist`, `comedian`, `anchor_emcee`, `magician`, `other` |
| Performer `format` | `individual`, `group` (requires `groupSize` 2–100) |
| Performer `durationMinutes` | integer 15–720 |
| Crew `crewRoles` | `photographer`, `videographer`, `sound_technician`, `lighting_technician`, `stage_manager`, `security`, `catering_staff`, `decorator`, `hospitality`, `runner` |
| Crew `experienceLevel` | `entry`, `intermediate`, `experienced`, `expert` |
| Crew `payBasis` | `per_hour`, `per_shift`, `per_day`, `fixed` |
| Crew `shiftHours` | 1–24 in steps of 0.5 |

The complete rules are in [backend/src/validation/requirement.schema.ts](backend/src/validation/requirement.schema.ts).
Amounts are in INR. Unknown fields are rejected (`strict` objects).

---

## Running locally

**Prerequisites:** Node.js 20.9+ (tested on Node 24). For MongoDB, use any one of:
Atlas, a local `mongod`, Docker (`docker run -p 27017:27017 mongo:8`), or the built-in
helper `npm run db:memory`, which downloads and runs a real `mongod` with data kept in `backend/.mongo-data/`.

```bash
# 1. Install
cd backend  && npm install
cd ../frontend && npm install

# 2. Configure
cp backend/.env.example  backend/.env          # set MONGODB_URI (local or Atlas)
cp frontend/.env.example frontend/.env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
# (Windows PowerShell: Copy-Item backend\.env.example backend\.env, etc.)

# 3. (Optional) local database, in its own terminal
cd backend && npm run db:memory

# 4. API, in its own terminal → http://localhost:4000
cd backend && npm run db:check   # confirms the DB is reachable and writable
cd backend && npm run dev

# 5. Web app, in its own terminal → http://localhost:3000 (landing) and /post-requirement (form)
cd frontend && npm run dev
```

If port 3000 is already in use, run `npx next dev --port 3001` and add
`http://localhost:3001` to `FRONTEND_URL` in `backend/.env` (comma-separated).

Production mode locally: `cd backend && npm run build && npm start` and
`cd frontend && npm run build && npm start`.

### Environment variables

| Where | Variable | Purpose |
| --- | --- | --- |
| backend | `PORT` | API port (default `4000`; Render sets it automatically) |
| backend | `MONGODB_URI` | MongoDB connection string. **Secret.** |
| backend | `MONGODB_DB_NAME` | Database name (optional, default `gopratle`). Passed to Mongoose as `dbName`, so it wins over any path in the URI without changing the auth database |
| backend | `FRONTEND_URL` | Allowed CORS origin(s), comma-separated, no trailing slash. Required when `NODE_ENV=production` |
| backend | `NODE_ENV` | `development`, `production` or `test` |
| frontend | `NEXT_PUBLIC_API_URL` | Base URL of the API. Public (inlined into the browser bundle at build time), so it must never contain secrets |

Only `.env.example` files are committed. `.gitignore` excludes `.env`, `.env.*` (except
the templates), keys/certificates, `node_modules`, build output, test artifacts and local Mongo data.

---

## Testing

```bash
cd backend  && npm run typecheck && npm test        # 50 API tests (in-memory MongoDB)
cd frontend && npm run typecheck && npm run lint && npm test   # 24 unit tests
cd frontend && npm run test:e2e                     # 19 browser tests (starts API + throwaway DB + Next dev)
cd frontend && npm run build
# or everything except e2e from the repo root:
npm run check
```

- **Backend (Vitest + Supertest + mongodb-memory-server):** creates all three categories and inspects the raw MongoDB documents. Covers missing fields, invalid/past/impossible dates and ranges, invalid category, details from the wrong category, category-specific rules, unknown fields, `$`-operator injection, malformed JSON, non-JSON bodies, oversized bodies, idempotent and concurrent retries, invalid and nonexistent IDs, CORS allow/deny, env validation, schema sync, and **database outage → 503 → recovery**.
- **Frontend unit (Vitest):** step schemas, payload building, per-category data preservation, error-path mapping, the API client's handling of every failure kind (network, timeout, 400/404/503, non-JSON, contract mismatch, missing env), and draft persistence.
- **End-to-end (Playwright, real browser):** landing page sections, hero CTA, service cards preselecting a category, category banner, error summary, every internal link and anchor resolving, requirement lookup, mobile menu; full Planner / Performer / Crew submissions verified through the API; Back/Edit navigation keeps data; validation messages; draft restore after reload; backend unavailable → error → retry creates exactly one record; lost response → retry reuses the idempotency key (no duplicate); double click / Enter sends one request; server validation errors mapped to fields; non-JSON "success" never shown as success; unknown IDs; mobile layout; no console or hydration errors.
  The e2e dev server uses its own build folder (`.next-e2e`), so it can run while your own `npm run dev` is running.
  The tests use the locally installed Google Chrome by default (`PW_CHANNEL=msedge` for Edge, or `npx playwright install chromium` then `PW_CHANNEL=` for bundled Chromium). The first run downloads a MongoDB test binary (~180 MB).

---

## Deployment

### 1. MongoDB Atlas

1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access →** add a database user with a long generated password and the *Read and write to any database* role (or `readWrite` on `gopratle` only). Don't reuse your Atlas login password.
3. **Network Access →** allow your own IP for local testing. Render's free tier has no static outbound IP, so add `0.0.0.0/0` (rely on the strong DB password) or use a paid plan's static IPs.
4. **Connect → Drivers** and copy the connection string. Either the `mongodb+srv://…` form or the standard `mongodb://host1,host2,host3/?ssl=true&replicaSet=…&authSource=admin` form works. Insert the password (URL-encode special characters). The app always uses the `gopratle` database (set via `MONGODB_DB_NAME`), so you don't need to edit the database path in the URI.
5. Paste it into `backend/.env` as `MONGODB_URI` and run `cd backend && npm run db:check`. The command never prints the URI.

> **If a connection string has ever been shared, pasted or committed**, rotate it: **Database Access → your user → Edit → Edit Password → Autogenerate**, then update `MONGODB_URI` in `backend/.env` and on Render. The old password stops working immediately.

### 2. Backend on Render

Either **New → Blueprint** with this repo (uses [render.yaml](render.yaml)), or **New → Web Service** with:

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Environment | `NODE_ENV=production`, `NODE_VERSION=22`, `MONGOMS_DISABLE_POSTINSTALL=1`, `MONGODB_URI=<Atlas URI>` (secret), `MONGODB_DB_NAME=gopratle`, `FRONTEND_URL=https://<your-app>.vercel.app` |

`--include=dev` is needed because TypeScript is a devDependency, and `npm ci` would skip it when `NODE_ENV=production`.
Check: `https://<service>.onrender.com/api/health` should return `"database":"connected"`.
On the free plan the service sleeps after inactivity, so the first request can take up to about a minute. The UI says so and lets the user retry safely.

### 3. Frontend on Vercel

1. **Add New → Project**, import the repo, set **Root Directory = `frontend`** (framework auto-detected as Next.js).
2. Environment variable: `NEXT_PUBLIC_API_URL=https://<service>.onrender.com` (no trailing slash) for Production (and Preview if wanted).
3. Deploy. Because `NEXT_PUBLIC_*` values are inlined at build time, **redeploy after changing it**.

### 4. Connect CORS

Render needs the Vercel URL (`FRONTEND_URL`) and Vercel needs the Render URL (`NEXT_PUBLIC_API_URL`), so deploy in this order:

1. Create the Render service first, with `FRONTEND_URL` set to the URL you expect from Vercel (`https://<vercel-project-name>.vercel.app`). In production the API refuses to start without `FRONTEND_URL`.
2. Create the Vercel project with `NEXT_PUBLIC_API_URL` set to the Render URL.
3. If Vercel assigned a different domain, update `FRONTEND_URL` on Render to that exact origin (no trailing slash) and redeploy the API.

Add preview URLs or a custom domain as extra comma-separated entries.
Then do a real submission for each category on the deployed site and open the "View saved requirement" link.

---

## Publishing to GitHub

```bash
git init -b main
git add .
git status                                   # review: no .env, .env.local, node_modules, .next, dist
git check-ignore -v backend/.env frontend/.env.local   # both must be listed as ignored
git commit -m "GoPratle requirement posting: Next.js + Express + MongoDB"
git remote add origin https://github.com/<you>/gopratle-requirements.git
git push -u origin main
```

If a secret file ever gets staged or committed, stop tracking it **without deleting your local copy**:

```bash
git rm --cached backend/.env        # removes it from Git only; the file stays on disk
git commit -m "Stop tracking backend/.env"
```

If it was already pushed, treat the secret as leaked: rotate it (see MongoDB Atlas above). Removing it from history alone is not enough.

---

## Assumptions and limitations

- No authentication. Anyone with the URL can post, and anyone with an ID can read that requirement (IDs are unguessable ObjectIds, but they're not secret). Contact details aren't collected because the brief doesn't ask for them.
- Amounts are INR. Event dates are calendar dates (no time or timezone); one day of slack lets users in any timezone pick their local "today".
- The idempotency key de-duplicates retries of the *same* payload. Editing the form after a failed attempt generates a new key. Keys are kept indefinitely (no TTL).
- No rate limiting; it should be added (e.g. `express-rate-limit`) before public launch.
- There is no list/search endpoint; the brief only requires create and read-by-ID.

### Possible improvements

Auth and "my requirements" dashboard · list endpoint with category filters for vendors · rate limiting and bot protection · email confirmation · file uploads (reference images) · i18n · CI (GitHub Actions running `npm run check` and the Playwright suite) · TTL on idempotency keys · OpenAPI spec.
