"use client";

import useSWR from "swr";

import type {
  Genre,
  Video,
  VideosResponse,
} from "~/features/video-browser/types";

const VIDEOS_ENDPOINT = "/api/videos";

const FALLBACK_ERROR_MESSAGE = "Could not load videos. Please try again.";

export interface UseVideosResult {
  videos: Array<Video>;
  genres: Array<Genre>;
  isLoading: boolean;
  error: Error | undefined;
  retry: () => void;
}

function isErrorBody(body: unknown): body is { message: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  );
}

async function fetchVideos(url: string): Promise<VideosResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);

    throw new Error(isErrorBody(body) ? body.message : FALLBACK_ERROR_MESSAGE);
  }

  return response.json() as Promise<VideosResponse>;
}

/**
 * Loads the video catalogue from our own route handler.
 *
 * The dataset is immutable, so revalidation on focus and reconnect is switched off
 * — it would refetch 160 KB for no benefit. `retry` re-runs the request for the
 * error state's button.
 */
export function useVideos(): UseVideosResult {
  const { data, error, isLoading, mutate } = useSWR<VideosResponse, Error>(
    VIDEOS_ENDPOINT,
    fetchVideos,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  return {
    videos: data?.videos ?? [],
    genres: data?.genres ?? [],
    isLoading,
    error,
    retry: () => {
      void mutate();
    },
  };
}
