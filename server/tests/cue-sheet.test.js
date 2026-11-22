import { prisma } from "../src/prisma.js";
import { csvCell, cueSheet } from "../src/cueSheet.js";
import { loggedInAs } from "./helpers.js";

describe("csvCell", () => {
  test("leaves plain text as it is", () => {
    expect(csvCell("1m1")).toBe("1m1");
  });

  test("turns empty values into an empty cell", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  test("puts text with a comma or a quote inside quotes", () => {
    expect(csvCell("Night, rain")).toBe('"Night, rain"');
    expect(csvCell('The "big" chase')).toBe('"The ""big"" chase"');
  });

  test("stops Excel from running a cell as a formula", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
});

describe("cueSheet", () => {
  test("has a header, a line per cue and the total", () => {
    const project = { fps: 24 };
    const cues = [
      {
        name: "1m1",
        scene: "Opening",
        timecodeIn: "01:00:00:00",
        timecodeOut: "01:00:30:00",
        status: "mixed",
      },
      {
        name: "1m2",
        scene: null,
        timecodeIn: "01:05:00:00",
        timecodeOut: "01:06:00:00",
        status: "sketch",
      },
    ];

    expect(cueSheet(project, cues).split("\r\n")).toEqual([
      "Cue,Scene,Timecode In,Timecode Out,Duration,Status",
      "1m1,Opening,01:00:00:00,01:00:30:00,00:00:30:00,mixed",
      "1m2,,01:05:00:00,01:06:00:00,00:01:00:00,sketch",
      "",
      "Total music,,,,00:01:30:00,2 cues",
      "",
    ]);
  });
});

describe("GET /api/projects/:id/cue-sheet", () => {
  let api;

  beforeEach(async () => {
    await prisma.cue.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    api = await loggedInAs();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("sends the cue sheet as a CSV file to download", async () => {
    const project = (await api.post("/api/projects").send({ title: "Dune", fps: 24 })).body;
    await api
      .post(`/api/projects/${project.id}/cues`)
      .send({ name: "1m1", timecodeIn: "01:00:00:00", timecodeOut: "01:00:30:00" });

    const res = await api.get(`/api/projects/${project.id}/cue-sheet`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^text\/csv/);
    expect(res.headers["content-disposition"]).toBe('attachment; filename="Dune - cue sheet.csv"');
    expect(res.text).toContain("1m1,,01:00:00:00,01:00:30:00,00:00:30:00,sketch");
  });

  test("answers 404 for a project that isn't mine", async () => {
    const noa = await loggedInAs("noa");
    const project = (await noa.post("/api/projects").send({ title: "Her", fps: 24 })).body;

    const res = await api.get(`/api/projects/${project.id}/cue-sheet`);

    expect(res.status).toBe(404);
  });
});
