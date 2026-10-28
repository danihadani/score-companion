import { validateProject } from "../src/validation/projects.js";

describe("validateProject", () => {
  test("returns the title without extra spaces", () => {
    const result = validateProject({ title: "  Dune  " });
    expect(result.title).toBe("Dune");
  });

  test("throws when the title is missing", () => {
    expect(() => validateProject({})).toThrow("TITLE_REQUIRED");
  });

  test("return the director without extra spaces", () => {
    const result = validateProject({ title: "Dune", director: " Villeneuve " });
    expect(result.director).toBe("Villeneuve");
  });

  test("returns null when there is no director", () => {
    const result = validateProject({ title: "Dune" });
    expect(result.director).toBeNull();
  });

  test("returns null when the director is only spaces", () => {
    const result = validateProject({ title: "Dune", director: "   " });
    expect(result.director).toBeNull();
  });
});
