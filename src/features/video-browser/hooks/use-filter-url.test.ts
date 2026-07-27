import { renderHook } from "@testing-library/react";

import {
  useFilterUrlSync,
  useRestoreFiltersFromUrl,
} from "~/features/video-browser/hooks/use-filter-url";
import type { VideoFilters } from "~/features/video-browser/types";
import { EMPTY_FILTERS } from "~/features/video-browser/utils/filter-url";

function goTo(search: string): void {
  window.history.replaceState(null, "", `/${search}`);
}

beforeEach(() => {
  goTo("");
});

describe("useRestoreFiltersFromUrl", () => {
  it("restores every filter present in the URL", () => {
    goTo("?q=beyonce&year=2008&genres=8,5");
    const onRestore = jest.fn();

    renderHook(() => useRestoreFiltersFromUrl(onRestore));

    expect(onRestore).toHaveBeenCalledWith({
      query: "beyonce",
      year: 2008,
      genreIds: [8, 5],
    });
  });

  it("stays quiet for a pristine URL rather than dispatching a no-op", () => {
    const onRestore = jest.fn();

    renderHook(() => useRestoreFiltersFromUrl(onRestore));

    expect(onRestore).not.toHaveBeenCalled();
  });

  it("stays quiet when the URL holds only unrelated parameters", () => {
    goTo("?utm_source=email");
    const onRestore = jest.fn();

    renderHook(() => useRestoreFiltersFromUrl(onRestore));

    expect(onRestore).not.toHaveBeenCalled();
  });

  it("restores a partial filter set", () => {
    goTo("?year=1991");
    const onRestore = jest.fn();

    renderHook(() => useRestoreFiltersFromUrl(onRestore));

    expect(onRestore).toHaveBeenCalledWith({
      query: "",
      year: 1991,
      genreIds: [],
    });
  });

  it("reads only once, not on every render", () => {
    goTo("?q=rock");
    const onRestore = jest.fn();
    const { rerender } = renderHook(() => useRestoreFiltersFromUrl(onRestore));

    rerender();
    rerender();

    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});

describe("useFilterUrlSync", () => {
  it("writes the active filters to the address bar", () => {
    renderHook(() =>
      useFilterUrlSync({ query: "beyonce", year: 2008, genreIds: [8] })
    );

    expect(window.location.search).toBe("?q=beyonce&year=2008&genres=8");
  });

  it("clears the query string once filters are reset", () => {
    goTo("?q=beyonce");

    renderHook(() => useFilterUrlSync(EMPTY_FILTERS));

    expect(window.location.search).toBe("");
  });

  it("keeps the path intact", () => {
    renderHook(() => useFilterUrlSync({ ...EMPTY_FILTERS, year: 2014 }));

    expect(window.location.pathname).toBe("/");
  });

  it("updates when the filters change", () => {
    const { rerender } = renderHook(
      ({ filters }: { filters: VideoFilters }) => useFilterUrlSync(filters),
      { initialProps: { filters: { ...EMPTY_FILTERS, year: 2014 } } }
    );

    expect(window.location.search).toBe("?year=2014");

    rerender({ filters: { ...EMPTY_FILTERS, year: 1991 } });

    expect(window.location.search).toBe("?year=1991");
  });

  it("does not touch history when the URL already matches", () => {
    const replaceState = jest.spyOn(window.history, "replaceState");

    renderHook(() => useFilterUrlSync(EMPTY_FILTERS));

    expect(replaceState).not.toHaveBeenCalled();
  });

  it("replaces rather than pushes, so typing cannot flood the back button", () => {
    const pushState = jest.spyOn(window.history, "pushState");

    renderHook(() => useFilterUrlSync({ ...EMPTY_FILTERS, query: "rock" }));

    expect(pushState).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?q=rock");
  });
});

describe("restore and sync together", () => {
  it("a URL survives a round trip through both hooks", () => {
    goTo("?q=olly+murs&year=2013&genres=5");
    const onRestore = jest.fn();

    renderHook(() => useRestoreFiltersFromUrl(onRestore));

    const restored = onRestore.mock.calls[0]?.[0] as VideoFilters;
    renderHook(() => useFilterUrlSync(restored));

    expect(window.location.search).toBe("?q=olly+murs&year=2013&genres=5");
  });
});
