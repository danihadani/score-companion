import { Router } from "express";
import { logger } from "../logger.js";

export const itunesRouter = Router();

const ITUNES_URL = "https://itunes.apple.com/search";

// GET /api/itunes/search?term=time - songs from iTunes, with 30-second previews

itunesRouter.get("/search", async (req, res) => {
  const term = typeof req.query.term === "string" ? req.query.term.trim() : "";
  if (!term) {
    return res.status(400).json({ error: "TERM_REQUIRED" });
  }
  if (term.length > 100) {
    return res.status(400).json({ error: "TERM_TOO_LONG" });
  }

  const url = new URL(ITUNES_URL);
  url.searchParams.set("term", term);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "10");

  let data;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`iTunes answered ${response.status}`);
    }
    data = await response.json();
  } catch (err) {
    logger.error(`iTunes search "${term}" failed: ${err.message}`);
    return res.status(502).json({ error: "ITUNES_UNAVAILABLE" });
  }

  logger.info(`iTunes search "${term}": ${data.resultCount} results`);

  res.json(
    data.results.map((song) => ({
      trackId: song.trackId,
      title: song.trackName,
      artist: song.artistName,
      link: song.trackViewUrl,
      previewUrl: song.previewUrl,
      artworkUrl: song.artworkUrl100,
    })),
  );
});
