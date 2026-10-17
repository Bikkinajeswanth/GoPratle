import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearDraft, draftHasContent, loadDraft, newIdempotencyKey, saveDraft } from "@/lib/draft";
import { defaultValues } from "@/lib/form";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
});

describe("draft persistence", () => {
  it("round-trips values, step and the pending idempotency key", () => {
    const values = structuredClone(defaultValues);
    values.eventBasics.eventName = "Diwali Mela";
    values.category = "performer";
    values.details.performer.requirements.genreOrStyle = "Folk";
    saveDraft({ values, step: 2, attempt: { key: "abc-12345678", body: "{}" } });

    const draft = loadDraft();
    expect(draft?.step).toBe(2);
    expect(draft?.values.details.performer.requirements.genreOrStyle).toBe("Folk");
    expect(draft?.attempt?.key).toBe("abc-12345678");
    expect(draftHasContent(draft)).toBe(true);
  });

  it("ignores corrupt drafts and clamps the step", () => {
    window.localStorage.setItem("gopratle:requirement-draft:v1", "{not json");
    expect(loadDraft()).toBeNull();

    window.localStorage.setItem(
      "gopratle:requirement-draft:v1",
      JSON.stringify({ values: { eventBasics: { eventName: "X" }, details: {} }, step: 99 }),
    );
    const draft = loadDraft();
    expect(draft?.step).toBe(3);
    expect(draft?.values.details.crew.requirements.skills).toEqual([]); // filled from defaults
  });

  it("clears the draft", () => {
    saveDraft({ values: defaultValues, step: 0, attempt: null });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("generates distinct idempotency keys", () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey());
    expect(newIdempotencyKey()).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
  });
});
