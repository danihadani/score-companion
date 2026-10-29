import { validateProject } from "../src/validation/projects.js";

describe("validateProject", () => {
  test("returns the title without extra spaces", () => {
    const result = validateProject({ title: "  Dune  ", fps: 24 });
    expect(result.title).toBe("Dune");
  });

  test("throws when the title is missing", () => {
    expect(() => validateProject({})).toThrow("TITLE_REQUIRED");
  });

  test("return the director without extra spaces", () => {
    const result = validateProject({ title: "Dune", director: " Villeneuve ", fps: 24 });
    expect(result.director).toBe("Villeneuve");
  });

  test("returns null when there is no director", () => {
    const result = validateProject({ title: "Dune", fps: 24 });
    expect(result.director).toBeNull();
  });

  test("returns null when the director is only spaces", () => {
    const result = validateProject({ title: "Dune", director: "   ", fps: 24 });
    expect(result.director).toBeNull();
  });

  test("accepts a whole frame rate", () => {
    const result = validateProject({ title: "Dune", fps: 24 });
    expect(result.fps).toBe(24);
  });

  test("throws when fps is missing", () => {
    expect(() => validateProject({ title: "Dune" })).toThrow("FPS_REQUIRED");
  });

  test("converts fps text to a number", () => {
    const result = validateProject({ title: "Dune", fps: "24" });
    expect(result.fps).toBe(24);
  });

  test("accept a decimal frame rate ", () => {
    const result = validateProject({ title: "Dune", fps: 23.976 });
    expect(result.fps).toBe(23.976);
  });

  test("throws when fps is not on the list", () => {
    expect(() => validateProject({ title: "Dune", fps: 240 })).toThrow("INVALID_FPS");
  });

  test("throws when fps is not a number", () => {
    expect(() => validateProject({ title: "Dune", fps: "abc" })).toThrow("INVALID_FPS");
  });
});
