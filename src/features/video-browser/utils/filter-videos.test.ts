import { videos } from "~/features/video-browser/test/fixtures/videos";
import type { VideoFilters } from "~/features/video-browser/types";
import { filterVideos } from "~/features/video-browser/utils/filter-videos";

const NO_FILTERS: VideoFilters = { query: "", year: null, genreIds: [] };

function idsFrom(filters: Partial<VideoFilters>): Array<number> {
  return filterVideos(videos, { ...NO_FILTERS, ...filters }).map(
    (video) => video.id
  );
}

describe("filterVideos", () => {
  it("returns everything when no filter is active", () => {
    expect(filterVideos(videos, NO_FILTERS)).toHaveLength(videos.length);
  });

  describe("text filter", () => {
    it("matches on artist", () => {
      expect(idsFrom({ query: "Pants Velour" })).toEqual([501437]);
    });

    it("matches on title", () => {
      expect(idsFrom({ query: "Single Ladies" })).toEqual([210001]);
    });

    it("ignores case", () => {
      expect(idsFrom({ query: "pAnTs" })).toEqual([501437]);
    });

    it("ignores accents, so beyonce finds Beyoncé", () => {
      expect(idsFrom({ query: "beyonce" })).toEqual([210001]);
    });

    it("matches a partial word", () => {
      expect(idsFrom({ query: "velo" })).toEqual([501437]);
    });

    it("ignores surrounding whitespace", () => {
      expect(idsFrom({ query: "   beyonce  " })).toEqual([210001]);
    });

    it("does not match a query straddling artist and title", () => {
      // "Pants Velour" / "All In" — neither field contains this on its own.
      expect(idsFrom({ query: "velour all" })).toEqual([]);
    });

    it("finds the row whose title upstream sent as a number", () => {
      expect(idsFrom({ query: "100" })).toEqual([866934]);
    });

    it("returns nothing for a query that matches no row", () => {
      expect(idsFrom({ query: "definitely not present" })).toEqual([]);
    });

    it("treats a whitespace-only query as no filter", () => {
      expect(idsFrom({ query: "   " })).toHaveLength(videos.length);
    });
  });

  describe("year filter", () => {
    it("keeps only the chosen year", () => {
      expect(idsFrom({ year: 2014 })).toEqual([501437]);
    });

    it("returns nothing for a year no video has", () => {
      expect(idsFrom({ year: 1900 })).toEqual([]);
    });

    it("treats null as all years", () => {
      expect(idsFrom({ year: null })).toHaveLength(videos.length);
    });
  });

  describe("genre filter", () => {
    it("keeps only the chosen genre", () => {
      expect(idsFrom({ genreIds: [5] })).toEqual([501437]);
    });

    it("ORs several genres together rather than intersecting them", () => {
      expect(idsFrom({ genreIds: [5, 8] })).toEqual([501437, 210001]);
    });

    it("treats an empty selection as all genres", () => {
      expect(idsFrom({ genreIds: [] })).toHaveLength(videos.length);
    });

    it("still returns rows whose genre could not be resolved when no genre is chosen", () => {
      const unresolved = videos.filter((video) => video.genreName === null);

      expect(unresolved.length).toBeGreaterThan(0);
      expect(idsFrom({})).toEqual(expect.arrayContaining([330002, 866934]));
    });

    it("excludes unresolved-genre rows once a genre is chosen", () => {
      expect(idsFrom({ genreIds: [5] })).not.toContain(330002);
    });
  });

  describe("combining filters with AND", () => {
    it("applies text and year together", () => {
      expect(idsFrom({ query: "beyonce", year: 2008 })).toEqual([210001]);
    });

    it("returns nothing when text and year disagree", () => {
      expect(idsFrom({ query: "beyonce", year: 2014 })).toEqual([]);
    });

    it("applies all three at once, as in the brief's example", () => {
      expect(idsFrom({ query: "beyonce", year: 2008, genreIds: [8] })).toEqual([
        210001,
      ]);
    });

    it("returns nothing when only the genre disagrees", () => {
      expect(idsFrom({ query: "beyonce", year: 2008, genreIds: [5] })).toEqual(
        []
      );
    });

    it("narrows rather than widens as filters are added", () => {
      const textOnly = idsFrom({ query: "a" });
      const textAndYear = idsFrom({ query: "a", year: 2014 });

      expect(textAndYear.length).toBeLessThanOrEqual(textOnly.length);
      expect(textOnly).toEqual(expect.arrayContaining(textAndYear));
    });
  });

  it("preserves the incoming order", () => {
    const filtered = filterVideos(videos, { ...NO_FILTERS, genreIds: [5, 8] });

    expect(filtered.map((video) => video.id)).toEqual([501437, 210001]);
  });

  it("does not mutate the input", () => {
    const snapshot = [...videos];

    filterVideos(videos, { ...NO_FILTERS, query: "beyonce" });

    expect(videos).toEqual(snapshot);
  });

  it("handles an empty catalogue", () => {
    expect(filterVideos([], { ...NO_FILTERS, query: "anything" })).toEqual([]);
  });
});
