import { parseDataset } from "~/features/video-browser/api/parse-dataset";
import { datasetFixture } from "~/features/video-browser/test/fixtures/dataset";
import type { Video } from "~/features/video-browser/types";

/**
 * Normalised videos for component tests. Built through `parseDataset` rather than
 * hand-written so the fixtures can never drift from the real shape — including the
 * numeric title and the orphan-genre row.
 */
export const { videos } = parseDataset(datasetFixture);

export function findVideo(id: number): Video {
  const match = videos.find((video) => video.id === id);

  if (!match) {
    throw new Error(`No fixture video with id ${id}`);
  }

  return match;
}
