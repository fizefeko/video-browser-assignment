import type { Video, VideoFilters } from "~/features/video-browser/types";
import { normalizeForSearch } from "~/features/video-browser/utils/normalize-search";

/**
 * Applies the three filters with AND logic: a video must satisfy every active
 * filter to survive. An inactive filter — empty query, null year, no genres — does
 * not constrain anything.
 *
 * Within the genre filter the logic is OR: picking Rock and Pop shows both, which
 * is the only sensible reading of a multi-select.
 *
 * Text matches artist OR title, each compared independently so a query can never
 * match across the two fields.
 */
export function filterVideos(
  videos: Array<Video>,
  filters: VideoFilters
): Array<Video> {
  const query = normalizeForSearch(filters.query);
  const genreIds = new Set(filters.genreIds);

  return videos.filter((video) => {
    if (
      query !== "" &&
      !video.searchArtist.includes(query) &&
      !video.searchTitle.includes(query)
    ) {
      return false;
    }

    if (filters.year !== null && video.releaseYear !== filters.year) {
      return false;
    }

    if (genreIds.size > 0 && !genreIds.has(video.genreId)) {
      return false;
    }

    return true;
  });
}
