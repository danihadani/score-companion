import { validateTempTrack } from "../src/validation/tempTracks.js";

describe("validateTempTrack", () => {
  test("returns a full temp track, without extra spaces", () => {
    const result = validateTempTrack({
      title: "  Time  ",
      artist: " Hans Zimmer ",
      link: "https://www.youtube.com/watch?v=RxabLA7UQ9k",
      notes: "The director loves the build-up",
    });
    expect(result).toEqual({
      title: "Time",
      artist: "Hans Zimmer",
      link: "https://www.youtube.com/watch?v=RxabLA7UQ9k",
      notes: "The director loves the build-up",
    });
  });

  test("only the title is required", () => {
    expect(validateTempTrack({ title: "Time" })).toEqual({
      title: "Time",
      artist: null,
      link: null,
      notes: null,
    });
  });

  test("throws when the title is missing or empty", () => {
    expect(() => validateTempTrack({})).toThrow("TITLE_REQUIRED");
    expect(() => validateTempTrack({ title: "   " })).toThrow("TITLE_REQUIRED");
  });

  test("throws when the title is too long", () => {
    expect(() => validateTempTrack({ title: "a".repeat(201) })).toThrow("TITLE_TOO_LONG");
  });

  test("turns empty optional fields into null", () => {
    const result = validateTempTrack({ title: "Time", artist: " ", link: "", notes: "  " });
    expect(result.artist).toBeNull();
    expect(result.link).toBeNull();
    expect(result.notes).toBeNull();
  });

  test("throws when the link is not a web address", () => {
    expect(() => validateTempTrack({ title: "Time", link: "not a link" })).toThrow("INVALID_LINK");
  });

  test("refuses a javascript: link, which would run code when clicked", () => {
    expect(() => validateTempTrack({ title: "Time", link: "javascript:alert(1)" })).toThrow(
      "INVALID_LINK",
    );
  });
});
