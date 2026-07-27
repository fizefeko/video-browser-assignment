import type { FilterOptions, Video } from "~/features/video-browser/types";

/**
 * Builds the year and genre choices from the videos themselves.
 *
 * Deriving from the videos rather than the dataset's `genres` table is
 * deliberate: three genres in that table have no videos at all, so listing them
 * would offer options whose only possible outcome is "No videos were found".
 * Videos whose `genre_id` had no match contribute no genre for the same reason —
 * a third of the catalogue is unfilterable by genre, and pretending otherwise
 * would be worse than omitting it.
 *
 * Pass every video for the full set of choices, or a subset to narrow the choices
 * to what the current search can actually return.
 */
export function deriveFilterOptions(videos: Array<Video>): FilterOptions {
  const years = new Set<number>();
  const genreNameById = new Map<number, string>();

  videos.forEach((video) => {
    years.add(video.releaseYear);

    if (video.genreName !== null) {
      genreNameById.set(video.genreId, video.genreName);
    }
  });

  return {
    years: [...years].sort((left, right) => right - left),
    genres: [...genreNameById]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}
