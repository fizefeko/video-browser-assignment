export interface Genre {
  id: number;
  name: string;
}

/**
 * A video normalised for rendering: camelCased, genre resolved, title guaranteed
 * to be a string. Produced only by `parseDataset` — nothing else constructs one.
 */
export interface Video {
  id: number;
  artist: string;
  title: string;
  releaseYear: number;
  genreId: number;
  /** `null` for the 166 rows whose `genre_id` has no entry in `genres`. */
  genreName: string | null;
  imageUrl: string;
  /**
   * Precomputed `normalizeForSearch(artist + title)` so a keystroke never
   * re-normalises 500 rows.
   */
  searchIndex: string;
}

/** A row that failed validation, kept for logging rather than thrown away silently. */
export interface RejectedRow {
  collection: "genres" | "videos";
  index: number;
  reason: string;
}

export interface ParsedDataset {
  videos: Video[];
  genres: Genre[];
  rejected: RejectedRow[];
}

/** The `GET /api/videos` body. `rejected` is diagnostic and stays server-side. */
export interface VideosResponse {
  videos: Video[];
  genres: Genre[];
}

/** The three filters, combined with AND logic. */
export interface VideoFilters {
  /** Free text matched against artist or title. Empty means no text filter. */
  query: string;
  /** `null` means all years. */
  year: number | null;
  /** Empty means all genres; several ids are OR-ed against each other. */
  genreIds: number[];
}

/**
 * The choices offered by the year and genre controls. Derived from a set of
 * videos rather than from the raw `genres` table, so an option can never produce
 * zero results.
 */
export interface FilterOptions {
  /** Newest first. */
  years: number[];
  /** Alphabetical. */
  genres: Genre[];
}
