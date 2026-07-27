import { parseDataset } from "~/features/video-browser/api/parse-dataset";
import {
  datasetFixture,
  videosFixture,
} from "~/features/video-browser/test/fixtures/dataset";

describe("parseDataset", () => {
  it("returns every well-formed row", () => {
    const { videos, genres, rejected } = parseDataset(datasetFixture);

    expect(videos).toHaveLength(videosFixture.length);
    expect(genres).toHaveLength(3);
    expect(rejected).toHaveLength(0);
  });

  it("camelCases the wire format", () => {
    const { videos } = parseDataset(datasetFixture);
    const [first] = videos;

    expect(first).toMatchObject({
      id: 501437,
      artist: "Pants Velour",
      title: "All In",
      releaseYear: 2014,
      genreId: 5,
      genreName: "Pop",
      imageUrl: "https://example.test/images/501437.jpg",
    });
  });

  it("keeps the numeric-title row and renders it as a string", () => {
    const { videos, rejected } = parseDataset(datasetFixture);
    const kid3rd = videos.find((video) => video.id === 866934);

    expect(kid3rd?.title).toBe("100");
    expect(typeof kid3rd?.title).toBe("string");
    expect(rejected).toHaveLength(0);
  });

  it("resolves genreName to null rather than dropping orphan-genre rows", () => {
    const { videos } = parseDataset(datasetFixture);
    const orphan = videos.find((video) => video.id === 330002);

    expect(orphan).toBeDefined();
    expect(orphan?.genreId).toBe(1);
    expect(orphan?.genreName).toBeNull();
  });

  it("precomputes an accent-folded search index over artist and title", () => {
    const { videos } = parseDataset(datasetFixture);
    const beyonce = videos.find((video) => video.id === 210001);

    expect(beyonce?.searchIndex).toBe(
      "beyonce single ladies (put a ring on it)"
    );
  });

  describe("row-level resilience", () => {
    it("drops one malformed row and keeps the rest", () => {
      const { videos, rejected } = parseDataset({
        ...datasetFixture,
        videos: [...videosFixture, { id: 1, artist: "Broken" }],
      });

      expect(videos).toHaveLength(videosFixture.length);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]).toMatchObject({
        collection: "videos",
        index: videosFixture.length,
      });
      expect(rejected[0]?.reason).toContain("title");
    });

    it("reports a malformed genre without discarding the videos", () => {
      const { videos, genres, rejected } = parseDataset({
        genres: [...datasetFixture.genres, { id: "nope", name: 42 }],
        videos: videosFixture,
      });

      expect(videos).toHaveLength(videosFixture.length);
      expect(genres).toHaveLength(3);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.collection).toBe("genres");
    });

    it("still resolves genre names for rows unaffected by a bad genre", () => {
      const { videos } = parseDataset({
        genres: [{ id: "nope", name: 42 }, ...datasetFixture.genres],
        videos: videosFixture,
      });

      expect(videos.find((video) => video.id === 501437)?.genreName).toBe(
        "Pop"
      );
    });
  });

  describe("envelope failures", () => {
    it.each([
      ["null", null],
      ["a missing videos array", { genres: [] }],
      ["a missing genres array", { videos: [] }],
      ["an unrelated payload", { hello: "world" }],
    ])("throws on %s, because that is not the dataset", (_label, payload) => {
      expect(() => parseDataset(payload)).toThrow();
    });
  });
});
