"use client";

import { useEffect, useRef } from "react";

/** How early to start loading, so the next page is usually ready on arrival. */
const PRELOAD_MARGIN = "300px 0px";

interface LoadMoreProps {
  /** How many videos are still unrevealed. */
  remaining: number;
  /** How many the next page will add. */
  nextPageSize: number;
  onLoadMore: () => void;
}

/**
 * Reveals the next page when the user scrolls near the end, and offers a button
 * that does the same thing.
 *
 * The button is not decoration. Scroll-triggered loading alone strands anyone not
 * scrolling with a pointer: keyboard users cannot reach content that only appears
 * on scroll, and a screen reader gets no signal that more exists. The button is the
 * accessible path and the observer is the convenience.
 */
export function LoadMore({
  remaining,
  nextPageSize,
  onLoadMore,
}: LoadMoreProps): React.ReactNode {
  const sentinelRef = useRef<HTMLDivElement>(null);

  /*
   * The observer reads the callback through a ref so the effect can run once.
   * Depending on `onLoadMore` directly would tear down and rebuild the observer
   * after every page; a fresh observer reports the sentinel's current state
   * immediately, so it would fire again straight away and cascade through the
   * entire list in one go.
   */
  const loadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (sentinel === null || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreRef.current();
        }
      },
      { rootMargin: PRELOAD_MARGIN }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  const label =
    nextPageSize === 1
      ? "Load 1 more video"
      : `Load ${nextPageSize} more videos`;

  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <button
        type="button"
        onClick={onLoadMore}
        className="border-control text-ink hover:bg-field focus-visible:outline-ink rounded-full border px-5 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {label}
      </button>
      <p className="text-ink-muted text-xs">
        {remaining === 1
          ? "1 video remaining"
          : `${remaining} videos remaining`}
      </p>
      {/* Watched, not seen — the observer needs a node below the button. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
    </div>
  );
}
