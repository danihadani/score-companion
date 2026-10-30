import { validateCue } from "../src/validation/cues.js";

// A valid cue. Each test changes only the field it is about.
const validCue = {
  name: "1m1",
  timecodeIn: "01:00:00:00",
  timecodeOut: "01:00:30:00",
};

describe("validateCue", () => {
  test("returns a valid cue, with the status defaulting to sketch", () => {
    expect(validateCue(validCue, 24)).toEqual({
      name: "1m1",
      timecodeIn: "01:00:00:00",
      timecodeOut: "01:00:30:00",
      scene: null,
      status: "sketch",
    });
  });

  test("trims spaces around the name", () => {
    const result = validateCue({ ...validCue, name: "  1m1  " }, 24);
    expect(result.name).toBe("1m1");
  });

  test("keeps a scene, without extra spaces", () => {
    const result = validateCue({ ...validCue, scene: "  The chase  " }, 24);
    expect(result.scene).toBe("The chase");
  });

  test("turns an empty scene into null", () => {
    const result = validateCue({ ...validCue, scene: "   " }, 24);
    expect(result.scene).toBeNull();
  });

  test("accepts every allowed status", () => {
    for (const status of ["sketch", "sent", "approved", "recorded", "mixed"]) {
      expect(validateCue({ ...validCue, status }, 24).status).toBe(status);
    }
  });

  test("throws when the name is missing or empty", () => {
    expect(() => validateCue({ ...validCue, name: undefined }, 24)).toThrow("NAME_REQUIRED");
    expect(() => validateCue({ ...validCue, name: "  " }, 24)).toThrow("NAME_REQUIRED");
  });

  test("throws when the status is not one of the allowed ones", () => {
    expect(() => validateCue({ ...validCue, status: "banana" }, 24)).toThrow("INVALID_STATUS");
  });

  test("throws when a timecode is not a timecode", () => {
    expect(() => validateCue({ ...validCue, timecodeIn: "abc" }, 24)).toThrow("INVALID_TIMECODE");
    expect(() => validateCue({ ...validCue, timecodeOut: undefined }, 24)).toThrow(
      "INVALID_TIMECODE",
    );
  });

  test("throws when the cue ends before it starts", () => {
    const backwards = { ...validCue, timecodeIn: "01:00:30:00", timecodeOut: "01:00:00:00" };
    expect(() => validateCue(backwards, 24)).toThrow("TIMECODE_OUT_BEFORE_IN");
  });

  test("throws when the cue ends exactly where it starts", () => {
    const empty = { ...validCue, timecodeIn: "01:00:00:00", timecodeOut: "01:00:00:00" };
    expect(() => validateCue(empty, 24)).toThrow("TIMECODE_OUT_BEFORE_IN");
  });

  test("checks the timecodes against the project's frame rate", () => {
    const frame24 = { ...validCue, timecodeIn: "00:00:00:24", timecodeOut: "00:00:10:00" };
    expect(() => validateCue(frame24, 24)).toThrow("INVALID_TIMECODE");
    expect(validateCue(frame24, 25).timecodeIn).toBe("00:00:00:24");
  });
});