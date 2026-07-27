import { NextResponse } from "next/server";

import { fetchDataset } from "~/features/video-browser/api/fetch-dataset";
import type { VideosResponse } from "~/features/video-browser/types";

interface ErrorResponse {
  message: string;
}

/**
 * Proxies the upstream dataset so validation, the genre join and the search-index
 * precompute happen once on the server instead of per client. The browser talks to
 * this route, which is what gives the UI real loading, error and retry states.
 */
export async function GET(): Promise<
  NextResponse<VideosResponse | ErrorResponse>
> {
  try {
    const { videos, genres, rejected } = await fetchDataset();

    if (rejected.length > 0) {
      console.warn(
        `[api/videos] skipped ${rejected.length} malformed row(s)`,
        rejected
      );
    }

    return NextResponse.json({ videos, genres });
  } catch (error) {
    console.error("[api/videos] could not load dataset", error);

    return NextResponse.json(
      { message: "Could not load videos. Please try again." },
      { status: 502 }
    );
  }
}
