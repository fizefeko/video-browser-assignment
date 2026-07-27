import { z } from "zod";

import {
  datasetEnvelopeSchema,
  genreSchema,
  rawVideoSchema,
  type RawVideo,
} from "~/features/video-browser/api/dataset-schema";
import type {
  Genre,
  ParsedDataset,
  RejectedRow,
  Video,
} from "~/features/video-browser/types";
import { normalizeForSearch } from "~/features/video-browser/utils/normalize-search";

function toVideo(raw: RawVideo, genreNameById: Map<number, string>): Video {
  return {
    id: raw.id,
    artist: raw.artist,
    title: raw.title,
    releaseYear: raw.release_year,
    genreId: raw.genre_id,
    genreName: genreNameById.get(raw.genre_id) ?? null,
    imageUrl: raw.image_url,
    searchIndex: normalizeForSearch(`${raw.artist} ${raw.title}`),
  };
}

/**
 * Validates and normalises the upstream payload.
 *
 * Throws only when the envelope itself is wrong — a payload without `videos` and
 * `genres` arrays is not the dataset. Individual bad rows are collected into
 * `rejected` and skipped, so one malformed record costs one video rather than the
 * whole response. Callers are expected to log `rejected`; this function stays pure.
 */
export function parseDataset(payload: unknown): ParsedDataset {
  const envelope = datasetEnvelopeSchema.parse(payload);
  const rejected: RejectedRow[] = [];

  const genres: Genre[] = [];
  envelope.genres.forEach((row, index) => {
    const result = genreSchema.safeParse(row);

    if (result.success) {
      genres.push(result.data);

      return;
    }

    rejected.push({
      collection: "genres",
      index,
      reason: z.prettifyError(result.error),
    });
  });

  const genreNameById = new Map(genres.map((genre) => [genre.id, genre.name]));

  const videos: Video[] = [];
  envelope.videos.forEach((row, index) => {
    const result = rawVideoSchema.safeParse(row);

    if (result.success) {
      videos.push(toVideo(result.data, genreNameById));

      return;
    }

    rejected.push({
      collection: "videos",
      index,
      reason: z.prettifyError(result.error),
    });
  });

  return { videos, genres, rejected };
}
