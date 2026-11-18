import { validateNote } from "../src/validation/notes.js";

describe("validateNote", () => {
  test("returns the text, without extra spaces", () => {
    expect(validateNote({ text: "  Less drums in the chase  " })).toEqual({
      text: "Less drums in the chase",
    });
  });

  test("throws when the text is missing or empty", () => {
    expect(() => validateNote({})).toThrow("TEXT_REQUIRED");
    expect(() => validateNote({ text: "   " })).toThrow("TEXT_REQUIRED");
    expect(() => validateNote(undefined)).toThrow("TEXT_REQUIRED");
  });

  test("throws when the text is too long", () => {
    expect(() => validateNote({ text: "a".repeat(2001) })).toThrow("TEXT_TOO_LONG");
  });
});
