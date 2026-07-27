"use client";

import {
  EMPTY_STATE_MESSAGE,
  EmptyState,
} from "~/features/video-browser/components/empty-state";
import { ErrorState } from "~/features/video-browser/components/error-state";
import { HeaderPanel } from "~/features/video-browser/components/header-panel";
import { SkipLink } from "~/features/video-browser/components/skip-link";
import { VideoCardList } from "~/features/video-browser/components/video-card-list";
import { VideoCardSkeletonGrid } from "~/features/video-browser/components/video-card-skeleton-grid";
import {
  useFilterUrlSync,
  useRestoreFiltersFromUrl,
} from "~/features/video-browser/hooks/use-filter-url";
import { useVideoFilters } from "~/features/video-browser/hooks/use-video-filters";
import { useVideos } from "~/features/video-browser/hooks/use-videos";
import type { Video } from "~/features/video-browser/types";

const RESULTS_REGION_ID = "video-results";

const LOADING_ANNOUNCEMENT = "Loading videos";

const FALLBACK_ERROR_MESSAGE = "Could not load videos. Please try again.";

function formatResultCount(count: number): string {
  return count === 1 ? "1 video found" : `${count} videos found`;
}

/**
 * What the live region says. Errors are excluded because `ErrorState` already
 * carries `role="alert"`, and announcing the same failure twice is worse than once.
 */
function getAnnouncement(
  isLoading: boolean,
  hasError: boolean,
  count: number
): string {
  if (hasError) {
    return "";
  }

  if (isLoading) {
    return LOADING_ANNOUNCEMENT;
  }

  if (count === 0) {
    return EMPTY_STATE_MESSAGE;
  }

  return formatResultCount(count);
}

interface ResultsProps {
  videos: Array<Video>;
  isLoading: boolean;
  error: Error | undefined;
  onRetry: () => void;
}

function Results({
  videos,
  isLoading,
  error,
  onRetry,
}: ResultsProps): React.ReactNode {
  if (error) {
    return (
      <ErrorState
        message={error.message || FALLBACK_ERROR_MESSAGE}
        onRetry={onRetry}
      />
    );
  }

  if (isLoading) {
    return <VideoCardSkeletonGrid />;
  }

  if (videos.length === 0) {
    return <EmptyState />;
  }

  return <VideoCardList videos={videos} />;
}

export function VideoBrowser(): React.ReactNode {
  const { videos, isLoading, error, retry } = useVideos();
  const {
    filters,
    results,
    options,
    setQuery,
    selectYear,
    toggleGenre,
    clearGenres,
    replaceAll,
  } = useVideoFilters(videos);

  // Deep-linked filters are adopted once on mount, then mirrored back as they
  // change, so a filtered view can be shared and survives a reload.
  useRestoreFiltersFromUrl(replaceAll);
  useFilterUrlSync(filters);

  return (
    // No max width here: the header is full-bleed so its rule spans the viewport,
    // and the results below re-apply the shared measure.
    <div className="relative">
      <SkipLink targetId={RESULTS_REGION_ID}>Skip to results</SkipLink>

      <HeaderPanel
        query={filters.query}
        year={filters.year}
        selectedGenreIds={filters.genreIds}
        options={options}
        onQueryChange={setQuery}
        onYearChange={selectYear}
        onGenreToggle={toggleGenre}
        onGenresClear={clearGenres}
      />

      {/*
        Counts the filtered results. Because the hook defers the query, this
        settles once typing pauses instead of firing on every keystroke, which
        would make the announcement unusable.
      */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {getAnnouncement(isLoading, Boolean(error), results.length)}
      </p>

      <div
        id={RESULTS_REGION_ID}
        // -1, not 0: the page itself scrolls now, so arrow keys and Page Down
        // already work without a tab stop here. It stays programmatically
        // focusable so the skip link actually moves focus rather than only
        // scrolling, which would leave the next Tab back up in the header.
        tabIndex={-1}
        role="region"
        aria-label="Video results"
        aria-busy={isLoading}
        // scroll-mt clears the sticky header: without it, following the skip link
        // scrolls this region to the very top of the viewport and the header covers
        // the first row of cards.
        className="focus-visible:outline-ink mx-auto w-full max-w-5xl scroll-mt-32 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <div className="px-4 pt-4 pb-8">
          <Results
            videos={results}
            isLoading={isLoading}
            error={error}
            onRetry={retry}
          />
        </div>
      </div>
    </div>
  );
}
