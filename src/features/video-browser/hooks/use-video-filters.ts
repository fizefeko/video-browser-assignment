"use client";

import { useDeferredValue, useMemo, useReducer } from "react";

import type {
  FilterOptions,
  Video,
  VideoFilters,
} from "~/features/video-browser/types";
import { deriveFilterOptions } from "~/features/video-browser/utils/derive-filter-options";
import { filterVideos } from "~/features/video-browser/utils/filter-videos";

export const INITIAL_FILTERS: VideoFilters = {
  query: "",
  year: null,
  genreIds: [],
};

export type FilterAction =
  | { type: "SET_QUERY"; query: string }
  | { type: "SELECT_YEAR"; year: number | null }
  | { type: "TOGGLE_GENRE"; genreId: number }
  | { type: "CLEAR_GENRES" };

function assertNever(action: never): never {
  throw new Error(`Unhandled filter action: ${JSON.stringify(action)}`);
}

/**
 * One reducer for all three filters rather than three pieces of state. Several
 * transitions touch more than one field, and a pure function is testable without
 * rendering anything.
 */
export function filtersReducer(
  state: VideoFilters,
  action: FilterAction
): VideoFilters {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.query };

    case "SELECT_YEAR":
      return { ...state, year: action.year };

    case "TOGGLE_GENRE":
      return {
        ...state,
        // Toggling is what makes selecting the same genre twice impossible.
        genreIds: state.genreIds.includes(action.genreId)
          ? state.genreIds.filter((id) => id !== action.genreId)
          : [...state.genreIds, action.genreId],
      };

    case "CLEAR_GENRES":
      return { ...state, genreIds: [] };
  }

  // No `default` branch on purpose. The switch is exhaustive over FilterAction,
  // so adding an action without handling it fails to compile here instead of
  // silently returning the previous state at runtime.
  return assertNever(action);
}

export interface UseVideoFiltersResult {
  /** What the controls display — always the immediate value the user typed. */
  filters: VideoFilters;
  /** Videos surviving every active filter. */
  results: Array<Video>;
  /** Choices for the year and genre controls, narrowed to the current search. */
  options: FilterOptions;
  setQuery: (query: string) => void;
  selectYear: (year: number | null) => void;
  toggleGenre: (genreId: number) => void;
  clearGenres: () => void;
}

export function useVideoFilters(videos: Array<Video>): UseVideoFiltersResult {
  const [filters, dispatch] = useReducer(filtersReducer, INITIAL_FILTERS);

  /**
   * Filtering 500 rows takes well under a millisecond, so a debounce would only
   * add latency and fight the brief's "filters as the user types". Deferring lets
   * React keep the input responsive while the grid catches up.
   */
  const deferredQuery = useDeferredValue(filters.query);

  const results = useMemo(
    () =>
      filterVideos(videos, {
        query: deferredQuery,
        year: filters.year,
        genreIds: filters.genreIds,
      }),
    [videos, deferredQuery, filters.year, filters.genreIds]
  );

  const allOptions = useMemo(() => deriveFilterOptions(videos), [videos]);

  const options = useMemo<FilterOptions>(() => {
    // Narrowed by the text search only. Narrowing by the year and genre
    // selections too would remove the very options the user just picked.
    const textMatches = filterVideos(videos, {
      query: deferredQuery,
      year: null,
      genreIds: [],
    });
    const narrowed = deriveFilterOptions(textMatches);
    const narrowedGenreIds = new Set(narrowed.genres.map((genre) => genre.id));
    const selectedGenreIds = new Set(filters.genreIds);

    /*
     * An active selection stays listed even when the text search excludes it.
     * Otherwise a native <select> would hold a value it no longer offers and
     * silently display the wrong one, and checked genres would vanish from the
     * panel while still filtering. The result set legitimately becomes empty —
     * that is AND logic doing its job — and the empty state explains it.
     */
    const years =
      filters.year !== null && !narrowed.years.includes(filters.year)
        ? [...narrowed.years, filters.year].sort((left, right) => right - left)
        : narrowed.years;

    return {
      years,
      genres: allOptions.genres.filter(
        (genre) =>
          narrowedGenreIds.has(genre.id) || selectedGenreIds.has(genre.id)
      ),
    };
  }, [videos, deferredQuery, filters.year, filters.genreIds, allOptions]);

  const actions = useMemo(
    () => ({
      setQuery: (query: string) => dispatch({ type: "SET_QUERY", query }),
      selectYear: (year: number | null) =>
        dispatch({ type: "SELECT_YEAR", year }),
      toggleGenre: (genreId: number) =>
        dispatch({ type: "TOGGLE_GENRE", genreId }),
      clearGenres: () => dispatch({ type: "CLEAR_GENRES" }),
    }),
    []
  );

  return { filters, results, options, ...actions };
}
