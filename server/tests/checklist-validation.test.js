import { validateChecklistItem, validateDone } from "../src/validation/checklist.js";

describe("validateChecklistItem", () => {
  test("returns the label, without extra spaces", () => {
    expect(validateChecklistItem({ label: "  Choir session  " })).toEqual({
      label: "Choir session",
    });
  });

  test("throws when the label is missing or empty", () => {
    expect(() => validateChecklistItem({})).toThrow("LABEL_REQUIRED");
    expect(() => validateChecklistItem({ label: "   " })).toThrow("LABEL_REQUIRED");
    expect(() => validateChecklistItem(undefined)).toThrow("LABEL_REQUIRED");
  });

  test("throws when the label is too long", () => {
    expect(() => validateChecklistItem({ label: "a".repeat(101) })).toThrow("LABEL_TOO_LONG");
  });
});

describe("validateDone", () => {
  test("accepts true and false", () => {
    expect(validateDone({ done: true })).toEqual({ done: true });
    expect(validateDone({ done: false })).toEqual({ done: false });
  });

  test("refuses anything that isn't true or false", () => {
    expect(() => validateDone({ done: "yes" })).toThrow("INVALID_DONE");
    expect(() => validateDone({})).toThrow("INVALID_DONE");
    expect(() => validateDone(undefined)).toThrow("INVALID_DONE");
  });
});
