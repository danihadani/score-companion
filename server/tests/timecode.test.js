import { timecodeToFrames, framesToTimecode } from "../src/timecode.js";

describe("timecodeToFrames", () => {
  test("adds hours, minutes, seconds and frames at 24 fps", () => {
    expect(timecodeToFrames("00:01:02:12", 24)).toBe(1500);
  });

  test("counts an hour as 86,400 frames at 24 fps", () => {
    expect(timecodeToFrames("01:00:00:00", 24)).toBe(86400);
  });

  test("uses 25 frames per second at 25 fps", () => {
    expect(timecodeToFrames("00:00:01:00", 25)).toBe(25);
  });

  test("counts 24 frames per second at 23.976 fps", () => {
    expect(timecodeToFrames("00:00:01:00", 23.976)).toBe(24);
  });

  test("counts 30 frames per second at 29.97 fps", () => {
    expect(timecodeToFrames("00:00:01:00", 29.97)).toBe(30);
  });

  test("throws when the format is wrong", () => {
    expect(() => timecodeToFrames("1:02:03:04", 24)).toThrow("INVALID_TIMECODE");
    expect(() => timecodeToFrames("01:02:03", 24)).toThrow("INVALID_TIMECODE");
    expect(() => timecodeToFrames("ab:cd:ef:gh", 24)).toThrow("INVALID_TIMECODE");
    expect(() => timecodeToFrames(undefined, 24)).toThrow("INVALID_TIMECODE");
  });

  test("throws when minutes or seconds are 60 or more", () => {
    expect(() => timecodeToFrames("00:60:00:00", 24)).toThrow("INVALID_TIMECODE");
    expect(() => timecodeToFrames("00:00:60:00", 24)).toThrow("INVALID_TIMECODE");
  });

  test("throws when frames reach the frame rate", () => {
    expect(() => timecodeToFrames("00:00:00:24", 24)).toThrow("INVALID_TIMECODE");
    expect(() => timecodeToFrames("00:00:00:24", 23.976)).toThrow("INVALID_TIMECODE");
    expect(timecodeToFrames("00:00:00:24", 25)).toBe(24);
  });
});

describe("framesToTimecode", () => {
  test("turns frames back into a timecode at 24 fps", () => {
    expect(framesToTimecode(1500, 24)).toBe("00:01:02:12");
  });

  test("pads every part to two digits", () => {
    expect(framesToTimecode(0, 24)).toBe("00:00:00:00");
    expect(framesToTimecode(86400, 24)).toBe("01:00:00:00");
  });

  test("uses the rounded rate at 29.97 fps", () => {
    expect(framesToTimecode(30, 29.97)).toBe("00:00:01:00");
  });

  test("is the opposite of timecodeToFrames", () => {
    const timecode = "02:13:47:21";
    expect(framesToTimecode(timecodeToFrames(timecode, 25), 25)).toBe(timecode);
  });

  test("throws on negative or fractional frames", () => {
    expect(() => framesToTimecode(-1, 24)).toThrow("INVALID_FRAMES");
    expect(() => framesToTimecode(1.5, 24)).toThrow("INVALID_FRAMES");
  });
});