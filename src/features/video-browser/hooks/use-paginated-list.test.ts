import { act, renderHook, type RenderHookResult } from "@testing-library/react";

import {
  PAGE_SIZE,
  usePaginatedList,
  type UsePaginatedListResult,
} from "~/features/video-browser/hooks/use-paginated-list";

function listOf(length: number, offset = 0): Array<number> {
  return Array.from({ length }, (_, index) => index + offset);
}

interface Props {
  items: Array<number>;
  resetKey: string;
}

function renderList(
  initialProps: Props
): RenderHookResult<UsePaginatedListResult<number>, Props> {
  return renderHook(
    ({ items, resetKey }: Props) => usePaginatedList(items, resetKey, 12),
    { initialProps }
  );
}

describe("usePaginatedList", () => {
  it("reveals only the first page initially", () => {
    const { result } = renderList({ items: listOf(40), resetKey: "" });

    expect(result.current.visible).toHaveLength(12);
    expect(result.current.visible[0]).toBe(0);
    expect(result.current.remaining).toBe(28);
    expect(result.current.hasMore).toBe(true);
  });

  it("defaults to twelve per page", () => {
    const { result } = renderHook(() => usePaginatedList(listOf(100), ""));

    expect(PAGE_SIZE).toBe(12);
    expect(result.current.visible).toHaveLength(12);
  });

  it("reveals another page on demand, keeping what was already shown", () => {
    const { result } = renderList({ items: listOf(40), resetKey: "" });

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.visible).toHaveLength(24);
    expect(result.current.visible[0]).toBe(0);
    expect(result.current.remaining).toBe(16);
  });

  it("stops at the end of the list rather than overshooting", () => {
    const { result } = renderList({ items: listOf(20), resetKey: "" });

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.visible).toHaveLength(20);
    expect(result.current.remaining).toBe(0);
    expect(result.current.hasMore).toBe(false);
  });

  it("reports no more pages when everything fits on the first", () => {
    const { result } = renderList({ items: listOf(5), resetKey: "" });

    expect(result.current.visible).toHaveLength(5);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.remaining).toBe(0);
  });

  it("handles an empty list", () => {
    const { result } = renderList({ items: [], resetKey: "" });

    expect(result.current.visible).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.remaining).toBe(0);
  });

  it("reveals the whole list through repeated pages", () => {
    const { result } = renderList({ items: listOf(30), resetKey: "" });

    act(() => {
      result.current.loadMore();
    });
    act(() => {
      result.current.loadMore();
    });

    expect(result.current.visible).toHaveLength(30);
    expect(result.current.hasMore).toBe(false);
  });

  describe("resetting", () => {
    it("returns to the first page when the reset key changes", () => {
      const { result, rerender } = renderList({
        items: listOf(40),
        resetKey: "?q=a",
      });

      act(() => {
        result.current.loadMore();
      });
      expect(result.current.visible).toHaveLength(24);

      rerender({ items: listOf(40, 100), resetKey: "?q=b" });

      expect(result.current.visible).toHaveLength(12);
      expect(result.current.visible[0]).toBe(100);
    });

    it("does not reset while the reset key is unchanged", () => {
      const { result, rerender } = renderList({
        items: listOf(40),
        resetKey: "?q=a",
      });

      act(() => {
        result.current.loadMore();
      });
      rerender({ items: listOf(40), resetKey: "?q=a" });

      expect(result.current.visible).toHaveLength(24);
    });

    it("survives a caller that rebuilds the array on every render", () => {
      // Resetting on array identity would re-render forever here.
      const { result, rerender } = renderHook(() =>
        usePaginatedList(listOf(40), "stable", 12)
      );

      act(() => {
        result.current.loadMore();
      });
      rerender();
      rerender();

      expect(result.current.visible).toHaveLength(24);
    });
  });

  it("keeps a stable loadMore identity so observers are not rebuilt", () => {
    const items = listOf(40);
    const { result, rerender } = renderList({ items, resetKey: "" });
    const before = result.current.loadMore;

    act(() => {
      result.current.loadMore();
    });
    rerender({ items, resetKey: "" });

    expect(result.current.loadMore).toBe(before);
  });
});
