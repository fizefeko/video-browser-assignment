import type { VideoFilters } from "~/features/video-browser/types";
import {
  EMPTY_FILTERS,
  parseFilters,
  serializeFilters,
} from "~/features/video-browser/utils/filter-url";

function parse(search: string): VideoFilters {
  return parseFilters(new URLSearchParams(search));
}

describe("serializeFilters", () => {
  it("produces nothing when no filter is active", () => {
    expect(serializeFilters(EMPTY_FILTERS)).toBe("");
  });

  it("includes only the active filters", () => {
    expect(serializeFilters({ ...EMPTY_FILTERS, year: 2014 })).toBe(
      "?year=2014"
    );
  });

  it("writes all three", () => {
    expect(
      serializeFilters({ query: "beyonce", year: 2008, genreIds: [8, 5] })
    ).toBe("?q=beyonce&year=2008&genres=8%2C5");
  });

  it("escapes characters that would break the query string", () => {
    expect(serializeFilters({ ...EMPTY_FILTERS, query: "a&b=c d" })).toBe(
      "?q=a%26b%3Dc+d"
    );
  });

  it("ignores a query that is only whitespace", () => {
    expect(serializeFilters({ ...EMPTY_FILTERS, query: "   " })).toBe("");
  });
});

describe("parseFilters", () => {
  it("returns empty filters for an empty query string", () => {
    expect(parse("")).toEqual(EMPTY_FILTERS);
  });

  it("reads all three back", () => {
    expect(parse("?q=beyonce&year=2008&genres=8,5")).toEqual({
      query: "beyonce",
      year: 2008,
      genreIds: [8, 5],
    });
  });

  it("decodes escaped characters", () => {
    expect(parse("?q=a%26b%3Dc+d").query).toBe("a&b=c d");
  });

  it.each([
    ["not-a-number", "?year=abc"],
    ["a decimal", "?year=2014.5"],
    ["an empty value", "?year="],
  ])("ignores a year that is %s", (_label, search) => {
    expect(parse(search).year).toBeNull();
  });

  it("drops genre ids that are not integers", () => {
    expect(parse("?genres=5,abc,8,,9.5").genreIds).toEqual([5, 8]);
  });

  it("deduplicates repeated genre ids, since the URL is user-editable", () => {
    expect(parse("?genres=5,5,8,5").genreIds).toEqual([5, 8]);
  });

  it("trims a padded query", () => {
    expect(parse("?q=%20%20beyonce%20%20").query).toBe("beyonce");
  });

  it("ignores parameters it does not own", () => {
    expect(parse("?utm_source=email&q=rock")).toEqual({
      query: "rock",
      year: null,
      genreIds: [],
    });
  });
});

describe("round trip", () => {
  it.each<VideoFilters>([
    EMPTY_FILTERS,
    { query: "beyonce", year: null, genreIds: [] },
    { query: "", year: 1991, genreIds: [] },
    { query: "", year: null, genreIds: [5, 8, 14] },
    { query: "olly murs", year: 2013, genreIds: [5] },
    { query: "a&b", year: 2017, genreIds: [1] },
  ])("survives serialise then parse: %p", (filters) => {
    expect(parse(serializeFilters(filters))).toEqual(filters);
  });
});
