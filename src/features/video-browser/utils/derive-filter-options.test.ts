import { videos } from "~/features/video-browser/test/fixtures/videos";
import { deriveFilterOptions } from "~/features/video-browser/utils/derive-filter-options";

describe("deriveFilterOptions", () => {
  it("lists every year present, newest first", () => {
    const { years } = deriveFilterOptions(videos);

    expect(years).toEqual([2017, 2014, 2008, 1991]);
  });

  it("deduplicates repeated years", () => {
    const sameYear = videos.map((video) => ({ ...video, releaseYear: 2014 }));

    expect(deriveFilterOptions(sameYear).years).toEqual([2014]);
  });

  it("lists genres alphabetically", () => {
    const { genres } = deriveFilterOptions(videos);

    expect(genres.map((genre) => genre.name)).toEqual(["Pop", "Rock"]);
  });

  it("omits genres that have no videos, so no option can return nothing", () => {
    const { genres } = deriveFilterOptions(videos);

    // The fixture's genre table also contains R&B/Soul, which no video uses.
    expect(genres.map((genre) => genre.name)).not.toContain("R&B/Soul");
  });

  it("contributes no genre for videos whose genre could not be resolved", () => {
    const { genres } = deriveFilterOptions(videos);
    const unresolved = videos.filter((video) => video.genreName === null);

    expect(unresolved.length).toBeGreaterThan(0);
    expect(genres).toHaveLength(2);
  });

  it("narrows the choices when given a subset", () => {
    const subset = videos.filter((video) => video.releaseYear === 2014);

    expect(deriveFilterOptions(subset)).toEqual({
      years: [2014],
      genres: [{ id: 5, name: "Pop" }],
    });
  });

  it("returns empty option lists for no videos", () => {
    expect(deriveFilterOptions([])).toEqual({ years: [], genres: [] });
  });
});
