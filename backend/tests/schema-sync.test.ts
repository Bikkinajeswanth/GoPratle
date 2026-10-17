import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const backendCopy = path.resolve(__dirname, "../src/validation/requirement.schema.ts");
const frontendCopy = path.resolve(__dirname, "../../frontend/src/lib/requirement.schema.ts");

// Render deploys only the backend directory, so skip when the frontend is not present.
describe.skipIf(!existsSync(frontendCopy))("shared schema", () => {
  it("frontend and backend use an identical requirement schema", () => {
    const normalise = (file: string) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");
    expect(normalise(frontendCopy), "Run `npm run sync:schema` from the repo root").toBe(normalise(backendCopy));
  });
});
