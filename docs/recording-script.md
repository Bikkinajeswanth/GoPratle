# Screen-recording script (about 6 minutes)

Talk naturally; the timings are a guide. Before you start: run the API and web app, open
`/` in a clean browser window, and have VS Code, a terminal and MongoDB (Atlas Data Explorer or Compass) ready.

---

**0:00–0:40 · Understanding the assignment** *(show the empty form)*

"Hi, I'm ___. The task was to build GoPratle's requirement-posting flow: a client describes an
event, chooses whether they need an Event Planner, a Performer or Crew, fills in category-specific
details over four steps, and the requirement is validated and stored in MongoDB.
I built it as a monorepo: a Next.js App Router frontend and an Express and Mongoose API, with Tailwind,
React Hook Form and Zod."

**0:40–1:30 · Design decisions and assumptions** *(VS Code: `backend/src/validation/requirement.schema.ts`)*

"The key decision was a single Zod schema shared by both sides. The frontend validates each step with it and the
server validates the full payload with exactly the same rules, so the two can't disagree. A test fails if the
two copies drift.
Categories are stored as `planner`, `performer` and `crew` with display labels only in the UI.
Assumptions: amounts are in INR, event dates are calendar dates that can't be in the past, and there's no
login because the brief didn't ask for one."

**1:30–3:00 · Working flow** *(browser)*

- Start on the landing page: "The landing page explains the three categories and the four steps. Each service card opens the form with that category already selected." Click **Post an Event Requirement**.
- Click **Continue** on the empty form: "An error summary appears, every required field is flagged and focus jumps to the first one."
- Fill step 1 and pick **Date range** with an end date before the start: "Date logic is enforced." Fix it.
- Choose **Performer** → step 2: "The banner keeps the chosen category visible, with a Change button. These fields only exist for performers. Choosing *Group* reveals group size."
- Step 3: budget and equipment; "optional fields are clearly marked."
- Click **Back** twice, then **Continue**: "Nothing is lost between steps. Each category even keeps its own answers."
- Refresh the page: "The draft is autosaved and restored."
- Review: "Everything is grouped into basics, requirements and additional details, each with an Edit button."
- **Submit**: "The button locks with a spinner. The success screen appears only after the server confirms the save, and shows the ID and category."
- Click **View saved requirement**: "This page reads the record back through the GET endpoint."

**3:00–4:00 · Implementation** *(VS Code)*

- `RequirementWizard.tsx`: "One React Hook Form instance with a step-aware Zod resolver. On submit I build the payload, check it against the full schema, and send it with an Idempotency-Key."
- `backend/src`: "Routes, controllers, model, validation middleware and a central error handler are separate. The POST route validates, checks the DB connection, then saves through a Mongoose discriminator for the chosen category."
- `models/Requirement.ts`: "`category` is the discriminator key, so it's stored explicitly on every document, and each category has its own strict `categoryDetails` schema."

**4:00–4:40 · API request/response and MongoDB** *(terminal + Atlas/Compass)*

- Run the README's `curl` POST → show **201** and the returned `id`.
- Run it with `"category": "caterer"` → show **400** with a field-level `details` array.
- `GET /api/requirements/<id>` → 200; a fake ID → 404; `abc` → 400.
- In Atlas, open `gopratle.requirements`: "Here are documents for all three categories, each with `eventBasics`, `category`, `categoryDetails`, and timestamps."

**4:40–5:40 · Testing and edge cases** *(terminal)*

- Run `npm test` in `backend`: "50 API tests against a real in-memory MongoDB. They cover all three categories, bad dates, wrong categories, injection attempts, malformed JSON, invalid IDs, and the database going down returning 503 then recovering."
- Run `npm run test:e2e` in `frontend` (or show its last run): "19 browser tests drive the real UI against the real API: each category end to end, back navigation, draft restore, the backend being unreachable then a retry, a lost response where the retry reuses the idempotency key so there's no duplicate, double-clicks sending one request, and server errors mapped to the right field."

**5:40–6:30 · Limitations and improvements**

"Limitations: no authentication or rate limiting yet, no listing endpoint, and Render's free tier sleeps, so
the first request can be slow. The UI explains that and retries are safe.
Next I'd add auth and a dashboard, a filtered list endpoint for vendors, rate limiting, CI running these test
suites, and an OpenAPI spec. Thanks for watching!"
