import { act, renderHook } from "@testing-library/react";

import {
  INITIAL_FILTERS,
  filtersReducer,
  useVideoFilters,
} from "~/features/video-browser/hooks/use-video-filters";
import { videos } from "~/features/video-browser/test/fixtures/videos";

describe("filtersReducer", () => {
  it("stores the query", () => {
    expect(
      filtersReducer(INITIAL_FILTERS, { type: "SET_QUERY", query: "x" })
    ).toEqual({ ...INITIAL_FILTERS, query: "x" });
  });

  it("stores a selected year and clears it again", () => {
    const selected = filtersReducer(INITIAL_FILTERS, {
      type: "SELECT_YEAR",
      year: 2014,
    });

    expect(selected.year).toBe(2014);
    expect(
      filtersReducer(selected, { type: "SELECT_YEAR", year: null }).year
    ).toBeNull();
  });

  it("adds a genre, then removes it on a second toggle", () => {
    const added = filtersReducer(INITIAL_FILTERS, {
      type: "TOGGLE_GENRE",
      genreId: 5,
    });

    expect(added.genreIds).toEqual([5]);
    expect(
      filtersReducer(added, { type: "TOGGLE_GENRE", genreId: 5 }).genreIds
    ).toEqual([]);
  });

  it("accumulates several genres", () => {
    const first = filtersReducer(INITIAL_FILTERS, {
      type: "TOGGLE_GENRE",
      genreId: 5,
    });
    const second = filtersReducer(first, { type: "TOGGLE_GENRE", genreId: 8 });

    expect(second.genreIds).toEqual([5, 8]);
  });

  it("cannot hold the same genre twice", () => {
    let state = INITIAL_FILTERS;

    for (let index = 0; index < 5; index += 1) {
      state = filtersReducer(state, { type: "TOGGLE_GENRE", genreId: 5 });
    }

    expect(state.genreIds.filter((id) => id === 5).length).toBeLessThanOrEqual(
      1
    );
  });

  it("clears every genre at once, leaving the other filters alone", () => {
    const state = filtersReducer(
      { query: "abc", year: 2014, genreIds: [5, 8] },
      { type: "CLEAR_GENRES" }
    );

    expect(state).toEqual({ query: "abc", year: 2014, genreIds: [] });
  });

  it("never mutates the state it is given", () => {
    const state = { query: "", year: null, genreIds: [5] };

    filtersReducer(state, { type: "TOGGLE_GENRE", genreId: 8 });

    expect(state.genreIds).toEqual([5]);
  });
});

describe("useVideoFilters", () => {
  it("starts with everything unfiltered", () => {
    const { result } = renderHook(() => useVideoFilters(videos));

    expect(result.current.filters).toEqual(INITIAL_FILTERS);
    expect(result.current.results).toHaveLength(videos.length);
  });

  it("applies the query to the results", () => {
    const { result } = renderHook(() => useVideoFilters(videos));

    act(() => {
      result.current.setQuery("beyonce");
    });

    expect(result.current.results.map((video) => video.id)).toEqual([210001]);
  });

  it("combines all three filters", () => {
    const { result } = renderHook(() => useVideoFilters(videos));

    act(() => {
      result.current.setQuery("beyonce");
      result.current.selectYear(2008);
      result.current.toggleGenre(8);
    });

    expect(result.current.results.map((video) => video.id)).toEqual([210001]);
  });

  it("returns nothing when the filters disagree", () => {
    const { result } = renderHook(() => useVideoFilters(videos));

    act(() => {
      result.current.setQuery("beyonce");
      result.current.selectYear(2014);
    });

    expect(result.current.results).toEqual([]);
  });

  describe("dynamic options", () => {
    it("offers every year and genre when nothing is searched", () => {
      const { result } = renderHook(() => useVideoFilters(videos));

      expect(result.current.options.years).toEqual([2017, 2014, 2008, 1991]);
      expect(result.current.options.genres.map((genre) => genre.name)).toEqual([
        "Pop",
        "Rock",
      ]);
    });

    it("narrows the options to what the search can return", () => {
      const { result } = renderHook(() => useVideoFilters(videos));

      act(() => {
        result.current.setQuery("beyonce");
      });

      expect(result.current.options.years).toEqual([2008]);
      expect(result.current.options.genres.map((genre) => genre.name)).toEqual([
        "Rock",
      ]);
    });

    it("does not narrow the options by the year selection itself", () => {
      const { result } = renderHook(() => useVideoFilters(videos));

      act(() => {
        result.current.selectYear(2008);
      });

      // Picking a year must not remove the other years from the dropdown.
      expect(result.current.options.years).toEqual([2017, 2014, 2008, 1991]);
    });

    it("does not narrow the genre options by the genre selection itself", () => {
      const { result } = renderHook(() => useVideoFilters(videos));

      act(() => {
        result.current.toggleGenre(5);
      });

      expect(result.current.options.genres).toHaveLength(2);
    });

    it("keeps a selected year listed even once the search excludes it", () => {
      const { result } = renderHook(() => useVideoFilters(videos));

      act(() => {
        result.current.selectYear(2014);
      });
      act(() => {
        result.current.setQuery("beyonce");
      });

      // Otherwise the select would hold a value it no longer offers.
      expect(result.current.options.years).toContain(2014);
      expect(result.current.results).toEqual([]);
    });

    it("keeps a selected genre listed even once the search excludes it", () => {
      const { result } = renderHook(() => useVideoFilters(videos));

      act(() => {
        result.current.toggleGenre(5);
      });
      act(() => {
        result.current.setQuery("beyonce");
      });

      expect(result.current.options.genres.map((genre) => genre.id)).toContain(
        5
      );
      expect(result.current.results).toEqual([]);
    });
  });

  it("keeps action identities stable across renders", () => {
    const { result, rerender } = renderHook(() => useVideoFilters(videos));
    const before = result.current.setQuery;

    rerender();

    expect(result.current.setQuery).toBe(before);
  });
});
