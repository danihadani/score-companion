import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";

// One song, the way iTunes sends it (only the fields we use).
const itunesSong = {
  trackId: 380350246,
  trackName: "Time",
  artistName: "Hans Zimmer",
  trackViewUrl: "https://music.apple.com/us/album/time/380349905?i=380350246",
  previewUrl: "https://audio-ssl.itunes.apple.com/time.m4a",
  artworkUrl100: "https://is1-ssl.mzstatic.com/time/100x100bb.jpg",
};

// The tests never reach the real iTunes: fetch is replaced with a fake
// that answers whatever each test needs.
function fakeItunesAnswer(body, ok = true) {
  return jest.spyOn(global, "fetch").mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    json: async () => body,
  });
}

afterEach(() => {
  // Put the real fetch back after every test.
  jest.restoreAllMocks();
});

describe("GET /api/itunes/search", () => {
  test("returns the songs with our own field names", async () => {
    fakeItunesAnswer({ resultCount: 1, results: [itunesSong] });

    const res = await request(app).get("/api/itunes/search?term=hans zimmer time");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        trackId: 380350246,
        title: "Time",
        artist: "Hans Zimmer",
        link: "https://music.apple.com/us/album/time/380349905?i=380350246",
        previewUrl: "https://audio-ssl.itunes.apple.com/time.m4a",
        artworkUrl: "https://is1-ssl.mzstatic.com/time/100x100bb.jpg",
      },
    ]);
  });

  test("sends the search term to iTunes, looking only for songs", async () => {
    const fetchSpy = fakeItunesAnswer({ resultCount: 0, results: [] });

    await request(app).get("/api/itunes/search?term=rock %26 roll");

    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl.hostname).toBe("itunes.apple.com");
    expect(calledUrl.searchParams.get("term")).toBe("rock & roll");
    expect(calledUrl.searchParams.get("entity")).toBe("song");
  });

  test("answers 400 without calling iTunes when the term is missing", async () => {
    const fetchSpy = fakeItunesAnswer({ resultCount: 0, results: [] });

    const res = await request(app).get("/api/itunes/search?term=   ");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TERM_REQUIRED");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("answers 400 when the term is too long", async () => {
    const res = await request(app).get(`/api/itunes/search?term=${"a".repeat(101)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TERM_TOO_LONG");
  });

  test("answers 502 when iTunes can't be reached", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));

    const res = await request(app).get("/api/itunes/search?term=time");

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("ITUNES_UNAVAILABLE");
  });

  test("answers 502 when iTunes answers with an error", async () => {
    fakeItunesAnswer({}, false);

    const res = await request(app).get("/api/itunes/search?term=time");

    expect(res.status).toBe(502);
  });
});
