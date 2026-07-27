import type { VideoFilters } from "~/features/video-browser/types";

export const QUERY_PARAM = "q";
export const YEAR_PARAM = "year";
export const GENRES_PARAM = "genres";

export const EMPTY_FILTERS: VideoFilters = {
  query: "",
  year: null,
  genreIds: [],
};

/**
 * Renders the active filters as a query string, omitting anything inactive so a
 * pristine view keeps a clean URL.
 */
export function serializeFilters(filters: VideoFilters): string {
  const params = new URLSearchParams();
  const query = filters.query.trim();

  if (query !== "") {
    params.set(QUERY_PARAM, query);
  }

  if (filters.year !== null) {
    params.set(YEAR_PARAM, `${filters.year}`);
  }

  if (filters.genreIds.length > 0) {
    params.set(GENRES_PARAM, filters.genreIds.join(","));
  }

  const search = params.toString();

  return search === "" ? "" : `?${search}`;
}

/**
 * `Number("")` is `0` and `Number.isInteger(0)` is true, so blank segments have to
 * be rejected before conversion or an empty `?year=` becomes the year zero.
 */
function toPositiveInteger(raw: string): number | null {
  if (raw.trim() === "") {
    return null;
  }

  const value = Number(raw);

  return Number.isInteger(value) && value > 0 ? value : null;
}

function parseYear(raw: string | null): number | null {
  return raw === null ? null : toPositiveInteger(raw);
}

function parseGenreIds(raw: string | null): Array<number> {
  if (raw === null) {
    return [];
  }

  const ids = raw
    .split(",")
    .map((part) => toPositiveInteger(part))
    .filter((id): id is number => id !== null);

  // Deduplicate: the URL is user-editable, and the rest of the app relies on a
  // genre appearing at most once.
  return [...new Set(ids)];
}

/**
 * Reads filters back out of a query string.
 *
 * Validation is syntactic only — this cannot know which years or genres exist. A
 * value that no video matches simply produces the empty state, which is the same
 * outcome as choosing it from the controls.
 */
export function parseFilters(params: URLSearchParams): VideoFilters {
  return {
    query: params.get(QUERY_PARAM)?.trim() ?? "",
    year: parseYear(params.get(YEAR_PARAM)),
    genreIds: parseGenreIds(params.get(GENRES_PARAM)),
  };
}
