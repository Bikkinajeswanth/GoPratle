import { expect, test, type Page } from "@playwright/test";

const API = "http://localhost:4100";
const HELPER = "http://localhost:4101";

function futureDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const group = (page: Page, name: string) => page.getByRole("group", { name });
const pick = (page: Page, groupName: string, option: string) =>
  group(page, groupName).getByText(option, { exact: true }).click();
const continueBtn = (page: Page) => page.getByRole("button", { name: "Continue" });
const submitBtn = (page: Page) => page.getByRole("button", { name: /Submit requirement|Submitting/ });

async function count(request: import("@playwright/test").APIRequestContext, category?: string) {
  const res = await request.get(`${HELPER}/count${category ? `?category=${category}` : ""}`);
  return ((await res.json()) as { count: number }).count;
}

async function fillBasics(page: Page, category: "Event Planner" | "Performer" | "Crew", eventName: string) {
  await page.getByLabel("Event name").fill(eventName);
  await page.getByLabel("Event type").selectOption("wedding");
  await pick(page, "Event dates", "Date range");
  await page.getByLabel("Start date").fill(futureDate(40));
  await page.getByLabel("End date").fill(futureDate(41));
  await page.getByLabel("Location").fill("Hyderabad, Telangana");
  await page.getByLabel("Venue name").fill("Taj Krishna");
  await group(page, "What are you looking for?").getByText(category, { exact: true }).click();
  await continueBtn(page).click();
}

async function fillPlanner(page: Page) {
  await pick(page, "Services required", "Venue sourcing");
  await pick(page, "Services required", "Decor & design");
  await page.getByLabel("Expected guest count").fill("350");
  await pick(page, "Planning scope", "Full planning (end to end)");
  await continueBtn(page).click();

  await page.getByLabel("Minimum").fill("500000");
  await page.getByLabel("Maximum").fill("900000");
  await pick(page, "Planning timeline", "1–3 months");
  await pick(page, "Additional services", "Photography");
  await page.getByLabel("Preferences or special requirements").fill("Pastel floral theme");
  await continueBtn(page).click();
}

async function fillCrew(page: Page) {
  await pick(page, "Required crew roles", "Photographer");
  await pick(page, "Required crew roles", "Sound technician");
  await page.getByLabel("Number of people required").fill("4");
  await pick(page, "Experience level", "Experienced (3–5 yrs)");
  const skills = page.getByLabel("Relevant skills");
  await skills.fill("DSLR photography");
  await skills.press("Enter");
  await skills.fill("Live mixing");
  await skills.press("Enter");
  await continueBtn(page).click();

  await page.getByLabel("Minimum").fill("2000");
  await page.getByLabel("Maximum").fill("4000");
  await pick(page, "Pay is calculated", "Per day");
  await page.getByLabel("Shift duration").fill("9.5");
  await page.getByLabel("Working hours").fill("8:30 AM – 6:00 PM");
  await continueBtn(page).click();
}

async function expectSuccess(page: Page, categoryLabel: string) {
  await expect(page.getByRole("heading", { name: "Requirement saved successfully" })).toBeVisible();
  const id = (await page.locator("code").first().textContent())!.trim();
  expect(id).toMatch(/^[a-f\d]{24}$/);
  await expect(page.getByRole("status").getByText(categoryLabel, { exact: true })).toBeVisible();
  return id;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/post-requirement");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel("Event name")).toBeVisible();
});

test("Event Planner: complete flow persists a planner requirement", async ({ page, request }) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  await page.reload();

  await fillBasics(page, "Event Planner", "Aarav & Meera Wedding");
  await fillPlanner(page);

  // Review screen groups everything
  await expect(page.getByRole("heading", { name: "Review your requirement" })).toBeVisible();
  await expect(page.getByText("Aarav & Meera Wedding")).toBeVisible();
  await expect(page.getByText("350 guests")).toBeVisible();
  await expect(page.getByText("₹5,00,000 – ₹9,00,000")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Event Planner requirements" })).toBeVisible();

  await submitBtn(page).click();
  const id = await expectSuccess(page, "Event Planner");

  const res = await request.get(`${API}/api/requirements/${id}`);
  const body = await res.json();
  expect(body.data.category).toBe("planner");
  expect(body.data.categoryDetails.requirements.servicesRequired).toEqual(["venue_sourcing", "decor_design"]);
  expect(body.data.categoryDetails.additional.budget).toEqual({ min: 500000, max: 900000 });

  // The saved record page reads it back through GET /api/requirements/:id
  await page.getByRole("link", { name: "View saved requirement" }).click();
  await expect(page.getByRole("heading", { name: "Aarav & Meera Wedding" })).toBeVisible();
  // Next keeps the previous page mounted but hidden, so match only visible text.
  await expect(page.getByText("Venue sourcing").filter({ visible: true })).toBeVisible();
  await page.reload(); // direct load of the record page (server render + hydration)
  await expect(page.getByRole("heading", { name: "Aarav & Meera Wedding" })).toBeVisible();

  expect(consoleErrors).toEqual([]); // no hydration or runtime errors
});

test("Performer: complete flow, and Back navigation keeps every answer", async ({ page, request }) => {
  await fillBasics(page, "Performer", "Annual Day Gala");

  await page.getByLabel("Performer type").selectOption("band");
  await page.getByLabel("Music genre or performance style").fill("Bollywood retro");
  await pick(page, "Individual or group", "Group");
  await page.getByLabel("Group size").fill("5");
  await page.getByRole("button", { name: "2 hrs" }).click();
  await continueBtn(page).click();

  await page.getByLabel("Minimum").fill("80000");
  await page.getByLabel("Maximum").fill("150000");
  await pick(page, "Sound, lighting & equipment needed", "Stage lighting");
  await page.getByLabel("Special instructions").fill("Arrive two hours early");

  // Go all the way back to step 1 and forward again: nothing is lost.
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Group size")).toHaveValue("5");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Event name")).toHaveValue("Annual Day Gala");
  await expect(page.getByLabel("End date")).toHaveValue(futureDate(41));
  await continueBtn(page).click();
  await expect(page.getByLabel("Music genre or performance style")).toHaveValue("Bollywood retro");
  await continueBtn(page).click();
  await expect(page.getByLabel("Special instructions")).toHaveValue("Arrive two hours early");
  await continueBtn(page).click();

  await expect(page.getByText("Group · 5 members")).toBeVisible();
  await expect(page.getByText("2 hrs")).toBeVisible();

  // Edit from the review screen, then come back
  await page.getByRole("button", { name: "Edit event basics" }).click();
  await page.getByLabel("Location").fill("Mumbai, Maharashtra");
  await continueBtn(page).click();
  await continueBtn(page).click();
  await continueBtn(page).click();
  await expect(page.getByText("Mumbai, Maharashtra")).toBeVisible();

  await submitBtn(page).click();
  const id = await expectSuccess(page, "Performer");

  const body = await (await request.get(`${API}/api/requirements/${id}`)).json();
  expect(body.data.category).toBe("performer");
  expect(body.data.eventBasics.location).toBe("Mumbai, Maharashtra");
  expect(body.data.categoryDetails.requirements).toMatchObject({ format: "group", groupSize: 5, durationMinutes: 120 });
});

test("Crew: complete flow persists a crew requirement", async ({ page, request }) => {
  await fillBasics(page, "Crew", "Tech Summit Crew");
  await fillCrew(page);
  await expect(page.getByText("DSLR photography")).toBeVisible();
  await expect(page.getByText("₹2,000 – ₹4,000 · per day")).toBeVisible();

  await submitBtn(page).click();
  const id = await expectSuccess(page, "Crew");
  const body = await (await request.get(`${API}/api/requirements/${id}`)).json();
  expect(body.data.category).toBe("crew");
  expect(body.data.categoryDetails.requirements.skills).toEqual(["DSLR photography", "Live mixing"]);
  expect(body.data.categoryDetails.additional.shiftHours).toBe(9.5);
});

test("validation: required fields, date range rule and category-specific rules", async ({ page }) => {
  await continueBtn(page).click();
  await expect(page.getByText("Event name is required")).toBeVisible();
  await expect(page.getByText("Select an event type")).toBeVisible();
  await expect(page.getByText("Event date is required")).toBeVisible();
  await expect(page.getByText("Location is required")).toBeVisible();
  await expect(page.getByText("Category must be one of: Event Planner, Performer, Crew")).toBeVisible();
  await expect(page.getByLabel("Event name")).toBeFocused();

  await page.getByLabel("Event name").fill("Range check");
  await page.getByLabel("Event type").selectOption("festival");
  await pick(page, "Event dates", "Date range");
  await page.getByLabel("Start date").fill(futureDate(20));
  await page.getByLabel("End date").fill(futureDate(10));
  await page.getByLabel("Location").fill("Goa");
  await group(page, "What are you looking for?").getByText("Crew", { exact: true }).click();
  await continueBtn(page).click();
  await expect(page.getByText("End date cannot be before the start date")).toBeVisible();

  await page.getByLabel("End date").fill(futureDate(22));
  await continueBtn(page).click();
  await expect(page.getByRole("heading", { name: "What do you need from the crew?" })).toBeVisible();

  // Category-specific: more roles than people
  await pick(page, "Required crew roles", "Security");
  await pick(page, "Required crew roles", "Runner / helper");
  await page.getByLabel("Number of people required").fill("1");
  await continueBtn(page).click();
  await expect(page.getByText("Select an experience level")).toBeVisible();
  await expect(page.getByText("Add at least one skill")).toBeVisible();

  // Errors clear live once fixed; the cross-field rule runs when the basic fields are valid.
  await pick(page, "Experience level", "Entry level (0–1 yrs)");
  await expect(page.getByText("Select an experience level")).toHaveCount(0);
  await page.getByLabel("Relevant skills").fill("Crowd control");
  await page.getByLabel("Relevant skills").press("Enter");
  await continueBtn(page).click();
  await expect(page.getByText("You selected 2 roles, so at least 2 people are needed")).toBeVisible();
  await page.getByLabel("Number of people required").fill("3");
  await expect(page.getByText("You selected 2 roles, so at least 2 people are needed")).toHaveCount(0);
  await continueBtn(page).click();
  await expect(page.getByRole("heading", { name: "Additional details" })).toBeVisible();
});

test("draft is restored after a page reload", async ({ page }) => {
  await fillBasics(page, "Event Planner", "Reload-safe event");
  await pick(page, "Services required", "Logistics & transport");
  await page.getByLabel("Expected guest count").fill("120");
  await page.waitForTimeout(500); // debounce

  await page.reload();
  await expect(page.getByText("We restored your unsaved draft")).toBeVisible();
  await expect(page.getByLabel("Expected guest count")).toHaveValue("120");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Event name")).toHaveValue("Reload-safe event");

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByLabel("Event name")).toHaveValue("");
});

test("backend unavailable: shows an error, keeps the form, and retry succeeds once", async ({ page, request }) => {
  const before = await count(request, "crew");
  await fillBasics(page, "Crew", "Offline retry event");
  await fillCrew(page);

  await page.route("**/api/requirements", (route) => route.abort("connectionrefused"));
  await submitBtn(page).click();
  await expect(page.getByText("We couldn't reach the server")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Requirement saved successfully" })).toHaveCount(0);
  await expect(page.getByText("Offline retry event")).toBeVisible(); // review data still there
  expect(await count(request, "crew")).toBe(before);

  await page.unroute("**/api/requirements");
  await page.getByRole("button", { name: "Try again" }).click();
  await expectSuccess(page, "Crew");
  expect(await count(request, "crew")).toBe(before + 1);
});

test("lost response: retry reuses the idempotency key and does not duplicate", async ({ page, request }) => {
  const before = await count(request, "planner");
  await fillBasics(page, "Event Planner", "Flaky network event");
  await fillPlanner(page);

  // First attempt reaches the server and is saved, but the browser never sees the response.
  let firstKey: string | undefined;
  await page.route("**/api/requirements", async (route) => {
    firstKey = route.request().headers()["idempotency-key"];
    await route.fetch();
    await route.abort("failed");
  });
  await submitBtn(page).click();
  await expect(page.getByText("We couldn't reach the server")).toBeVisible();
  expect(await count(request, "planner")).toBe(before + 1);

  await page.unroute("**/api/requirements");
  const retry = page.waitForRequest((r) => r.url().endsWith("/api/requirements") && r.method() === "POST");
  await page.getByRole("button", { name: "Try again" }).click();
  expect((await retry).headers()["idempotency-key"]).toBe(firstKey);
  await expectSuccess(page, "Event Planner");
  expect(await count(request, "planner")).toBe(before + 1);
});

test("duplicate clicks send a single request", async ({ page, request }) => {
  const before = await count(request, "crew");
  await fillBasics(page, "Crew", "Double click event");
  await fillCrew(page);

  let posts = 0;
  await page.route("**/api/requirements", async (route) => {
    posts++;
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });

  const button = submitBtn(page);
  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toHaveText(/Submitting/);
  await button.click({ force: true }).catch(() => {});
  await page.keyboard.press("Enter");

  await expectSuccess(page, "Crew");
  expect(posts).toBe(1);
  expect(await count(request, "crew")).toBe(before + 1);
});

test("server validation errors are shown on the right field", async ({ page }) => {
  await fillBasics(page, "Crew", "Server says no");
  await fillCrew(page);

  await page.route("**/api/requirements", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The request payload is invalid",
          details: [{ path: "categoryDetails.requirements.numberOfPeople", message: "Number of people must be at most 500" }],
        },
      }),
    }),
  );
  await submitBtn(page).click();
  await expect(page.getByRole("heading", { name: "What do you need from the crew?" })).toBeVisible();
  await expect(page.getByText("Number of people must be at most 500")).toBeVisible();
});

test("invalid response bodies are never shown as success", async ({ page }) => {
  await fillBasics(page, "Crew", "Bad gateway event");
  await fillCrew(page);
  await page.route("**/api/requirements", (route) =>
    route.fulfill({ status: 201, contentType: "text/html", body: "<html>proxy error</html>" }),
  );
  await submitBtn(page).click();
  await expect(page.getByText("We couldn't confirm your requirement was saved")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Requirement saved successfully" })).toHaveCount(0);
});

test("requirement page handles invalid and unknown IDs", async ({ page }) => {
  await page.goto("/requirements/not-a-real-id");
  await expect(page.getByText("Requirement not found")).toBeVisible();
  await page.goto("/requirements/0123456789abcdef01234567");
  await expect(page.getByText("Requirement not found")).toBeVisible();
});

test("@mobile layout fits a phone screen and the flow works", async ({ page }) => {
  await expect(page.getByText("Step 1 of 4", { exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await fillBasics(page, "Performer", "Mobile event");
  await expect(page.getByText("Step 2 of 4", { exact: true })).toBeVisible();
});
