import { expect, test, type Page } from "@playwright/test";

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test("landing page: hero, services, how it works, benefits and footer", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Find the Right People for Your Event" })).toBeVisible();
  for (const name of ["Who do you need?", "Four short steps", "Clear requirements, less back-and-forth"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  for (const name of ["Event Planner", "Performer", "Crew"]) {
    await expect(page.locator("#services").getByRole("heading", { level: 3, name })).toBeVisible();
  }
  for (const name of ["Convenient", "Organized requirements", "Category-specific requests"]) {
    await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  }
  await expect(page.getByRole("contentinfo")).toBeVisible();
  expect(errors).toEqual([]);
});

test("hero CTA opens the four-step form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Post an Event Requirement" }).first().click();
  await expect(page).toHaveURL(/\/post-requirement$/);
  await expect(page.getByText("Step 1 of 4 · Event Basics")).toBeVisible();
  await expect(page.getByLabel("Event name")).toBeVisible();
});

test("service cards preselect the category, and the banner lets you change it", async ({ page }) => {
  await page.goto("/post-requirement");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.getByRole("link", { name: "Post a crew requirement" }).click();
  await expect(page.getByRole("radio", { name: /Crew/ })).toBeChecked();
  await expect(page).toHaveURL(/\/post-requirement$/); // query removed after it is applied

  const d = new Date();
  d.setDate(d.getDate() + 30);
  await page.getByLabel("Event name").fill("Preselected crew event");
  await page.getByLabel("Event type").selectOption("concert");
  await page.getByLabel("Event date").fill(d.toISOString().slice(0, 10));
  await page.getByLabel("Location").fill("Delhi");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Requirement for")).toBeVisible();
  await page.getByRole("button", { name: "Change category" }).click();
  await expect(page.getByLabel("Event name")).toHaveValue("Preselected crew event");
});

test("error summary appears when Continue is pressed with missing fields", async ({ page }) => {
  await page.goto("/post-requirement");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/Please fix \d+ fields to continue/)).toBeVisible();
  await page.getByLabel("Event name").fill("Fixing things");
  await expect(page.getByText(/Please fix \d+ fields to continue/)).toBeVisible(); // others still missing
});

test("every internal link and in-page anchor resolves", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page.locator("a[href]").evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  expect(hrefs.length).toBeGreaterThan(5);
  for (const href of hrefs) {
    expect(href, "no placeholder links").not.toMatch(/^#?$|^javascript:/);
    if (/^https?:/.test(href)) continue;
    const [path, hash] = href.split("#");
    const res = await request.get(path || "/");
    expect(res.status(), `${href} should load`).toBe(200);
    if (hash && (path === "/" || path === "")) {
      await expect(page.locator(`#${hash}`), `#${hash} should exist`).toHaveCount(1);
    }
  }
});

test("requirement lookup validates the ID and opens the record page", async ({ page }) => {
  await page.goto("/requirements");
  await page.getByRole("button", { name: "Find requirement" }).click();
  await expect(page.getByText("Enter a requirement ID")).toBeVisible();
  await page.getByLabel("Requirement ID").fill("12345");
  await page.getByRole("button", { name: "Find requirement" }).click();
  await expect(page.getByText("A requirement ID is 24 characters (0–9 and a–f)")).toBeVisible();
  await page.getByLabel("Requirement ID").fill("0123456789abcdef01234567");
  await page.getByRole("button", { name: "Find requirement" }).click();
  await expect(page).toHaveURL(/\/requirements\/0123456789abcdef01234567$/);
  await expect(page.getByText("Requirement not found")).toBeVisible();
});

test("@mobile landing fits the screen and the menu navigates", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.locator("#mobile-nav");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  await page.getByRole("button", { name: "Open menu" }).click();
  await menu.getByRole("link", { name: "Post an Event Requirement" }).click();
  await expect(page).toHaveURL(/\/post-requirement$/);
  await expect(page.getByText("Step 1 of 4", { exact: true })).toBeVisible();
});
