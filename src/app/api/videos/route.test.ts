/**
 * @jest-environment node
 */
import { GET } from "~/app/api/videos/route";
import { fetchDataset } from "~/features/video-browser/api/fetch-dataset";
import { parseDataset } from "~/features/video-browser/api/parse-dataset";
import { datasetFixture } from "~/features/video-browser/test/fixtures/dataset";

jest.mock("~/features/video-browser/api/fetch-dataset", () => ({
  fetchDataset: jest.fn(),
}));

const mockFetchDataset = fetchDataset as jest.MockedFunction<
  typeof fetchDataset
>;

describe("GET /api/videos", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns the videos and genres", async () => {
    mockFetchDataset.mockResolvedValue(parseDataset(datasetFixture));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      videos: expect.any(Array),
      genres: expect.any(Array),
    });
  });

  it("keeps the diagnostic reject list out of the response", async () => {
    mockFetchDataset.mockResolvedValue(parseDataset(datasetFixture));

    const body = await (await GET()).json();

    expect(body).not.toHaveProperty("rejected");
  });

  it("logs malformed rows rather than swallowing them", async () => {
    mockFetchDataset.mockResolvedValue(
      parseDataset({
        genres: datasetFixture.genres,
        videos: [...datasetFixture.videos, { id: 1, artist: "Broken" }],
      })
    );

    await GET();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("skipped 1 malformed row"),
      expect.anything()
    );
  });

  it("stays quiet when every row is valid", async () => {
    mockFetchDataset.mockResolvedValue(parseDataset(datasetFixture));

    await GET();

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("answers 502 with a user-facing message when the upstream fails", async () => {
    mockFetchDataset.mockRejectedValue(new Error("upstream exploded"));

    const response = await GET();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: "Could not load videos. Please try again.",
    });
  });

  it("does not leak the internal error to the client", async () => {
    mockFetchDataset.mockRejectedValue(
      new Error("connect ECONNREFUSED 10.0.0.1:443")
    );

    const body = await (await GET()).json();

    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
  });

  it("logs the underlying failure for operators", async () => {
    const cause = new Error("upstream exploded");
    mockFetchDataset.mockRejectedValue(cause);

    await GET();

    expect(console.error).toHaveBeenCalledWith(expect.any(String), cause);
  });
});
