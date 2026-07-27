"use client";

import { useEffect } from "react";

import type { VideoFilters } from "~/features/video-browser/types";
import {
  parseFilters,
  serializeFilters,
} from "~/features/video-browser/utils/filter-url";

/**
 * Reads filters out of the address bar once, after mount, and hands them to the
 * caller.
 *
 * Deliberately not `useSearchParams`: on a statically prerendered route that hook
 * demands a Suspense boundary, and suspending the whole browser would throw away
 * the server-rendered shell that gives the page its fast first paint. Reading after
 * mount costs a frame of unfiltered state instead — invisible, because the video
 * data has not arrived yet and the skeleton is still on screen.
 *
 * `onRestore` must be referentially stable; the memoised actions from
 * `useVideoFilters` are.
 */
export function useRestoreFiltersFromUrl(
  onRestore: (filters: VideoFilters) => void
): void {
  useEffect(() => {
    const restored = parseFilters(new URLSearchParams(window.location.search));

    // Nothing to restore for a pristine URL, and dispatching would be a wasted
    // render.
    if (serializeFilters(restored) !== "") {
      onRestore(restored);
    }
  }, [onRestore]);
}

/**
 * Mirrors the active filters into the address bar so a filtered view can be
 * shared, bookmarked and survives a reload.
 *
 * Uses `history.replaceState` rather than `router.replace`. The App Router would
 * re-run the route on every keystroke, and nothing on the page needs to react to
 * the change — after mount the reducer is the source of truth. `replaceState` also
 * avoids stacking a history entry per character typed, which would make the back
 * button useless.
 */
export function useFilterUrlSync(filters: VideoFilters): void {
  useEffect(() => {
    const next = `${window.location.pathname}${serializeFilters(filters)}`;
    const current = `${window.location.pathname}${window.location.search}`;

    if (next !== current) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [filters]);
}
