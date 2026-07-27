import "server-only";

import { parseDataset } from "~/features/video-browser/api/parse-dataset";
import type { ParsedDataset } from "~/features/video-browser/types";

const DATASET_URL =
  "https://raw.githubusercontent.com/XiteTV/frontend-coding-exercise/main/data/dataset.json";

/** One hour — the dataset is a static file that effectively never changes. */
const REVALIDATE_SECONDS = 3600;

/** Thrown when the upstream request itself fails, as opposed to returning bad data. */
export class DatasetFetchError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Dataset request failed with status ${status}`);
    this.name = "DatasetFetchError";
    this.status = status;
  }
}

/**
 * Fetches the dataset as if calling a real backend, then validates it. Server-only
 * so the upstream URL and the validation cost never ship to the browser.
 */
export async function fetchDataset(): Promise<ParsedDataset> {
  const response = await fetch(DATASET_URL, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new DatasetFetchError(response.status);
  }

  return parseDataset(await response.json());
}
