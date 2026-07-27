"use client";

import { useCallback, useMemo, useState } from "react";

/** Videos revealed per page. */
export const PAGE_SIZE = 12;

export interface UsePaginatedListResult<Item> {
  /** The slice currently rendered. */
  visible: Array<Item>;
  /** How many more exist beyond `visible`. */
  remaining: number;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Reveals a list one page at a time.
 *
 * `resetKey` describes *why* the list would start over — a filter change — and is
 * compared by value. Resetting on the array's identity instead would loop forever
 * for any caller that builds the array inline, since a fresh array every render
 * would look like a fresh list every render.
 */
export function usePaginatedList<Item>(
  items: Array<Item>,
  resetKey: string,
  pageSize: number = PAGE_SIZE
): UsePaginatedListResult<Item> {
  const [page, setPage] = useState({ key: resetKey, count: pageSize });

  /*
   * Adjusted during render rather than in an effect. An effect would paint one
   * frame with the previous page size against the new list — visibly showing 36
   * results for an instant before snapping back to 12. React re-renders
   * immediately here without painting the intermediate state.
   */
  if (page.key !== resetKey) {
    setPage({ key: resetKey, count: pageSize });
  }

  const count = page.key === resetKey ? page.count : pageSize;

  const visible = useMemo(() => items.slice(0, count), [items, count]);

  const loadMore = useCallback(() => {
    setPage((current) => ({ ...current, count: current.count + pageSize }));
  }, [pageSize]);

  return {
    visible,
    remaining: Math.max(items.length - visible.length, 0),
    hasMore: visible.length < items.length,
    loadMore,
  };
}
