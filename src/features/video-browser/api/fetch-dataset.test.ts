/**
 * @jest-environment node
 */
import {
  DatasetFetchError,
  fetchDataset,
} from "~/features/video-browser/api/fetch-dataset";
import { datasetFixture } from "~/features/video-browser/test/fixtures/dataset";

const mockFetch = jest.fn();

global.fetch = mockFetch as unknown as typeof fetch;

function respondWith(body: unknown, ok = true, status = 200): void {
  mockFetch.mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("fetchDataset", () => {
  it("returns the parsed dataset", async () => {
    respondWith(datasetFixture);

    const { videos, genres, rejected } = await fetchDataset();

    expect(videos).toHaveLength(4);
    expect(genres).toHaveLength(3);
    expect(rejected).toHaveLength(0);
  });

  it("requests the documented upstream endpoint", async () => {
    respondWith(datasetFixture);

    await fetchDataset();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/XiteTV/frontend-coding-exercise/main/data/dataset.json",
      expect.anything()
    );
  });

  it("asks Next to cache the response for an hour", async () => {
    respondWith(datasetFixture);

    await fetchDataset();

    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
      next: { revalidate: 3600 },
    });
  });

  it("normalises the numeric title on the way through", async () => {
    respondWith(datasetFixture);

    const { videos } = await fetchDataset();

    expect(videos.find((video) => video.id === 866934)?.title).toBe("100");
  });

  it.each([
    [500, "an upstream server error"],
    [404, "a missing file"],
    [403, "a rejected request"],
  ])("throws for status %i (%s)", async (status) => {
    respondWith(null, false, status);

    await expect(fetchDataset()).rejects.toThrow(DatasetFetchError);
  });

  it("records the upstream status on the error", async () => {
    respondWith(null, false, 503);

    await expect(fetchDataset()).rejects.toMatchObject({
      name: "DatasetFetchError",
      status: 503,
    });
  });

  it("does not parse the body of a failed response", async () => {
    const json = jest.fn();
    mockFetch.mockResolvedValue({ ok: false, status: 500, json });

    await expect(fetchDataset()).rejects.toThrow(DatasetFetchError);
    expect(json).not.toHaveBeenCalled();
  });

  it("surfaces a validation failure rather than returning junk", async () => {
    respondWith({ nothing: "useful" });

    await expect(fetchDataset()).rejects.not.toBeInstanceOf(DatasetFetchError);
  });

  it("propagates a network failure untouched", async () => {
    mockFetch.mockRejectedValue(new Error("socket hang up"));

    await expect(fetchDataset()).rejects.toThrow("socket hang up");
  });
});
