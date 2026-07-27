"use client";

import { useMemo, useState } from "react";

import {
  EMPTY_STATE_MESSAGE,
  EmptyState,
} from "~/features/video-browser/components/empty-state";
import { ErrorState } from "~/features/video-browser/components/error-state";
import { HeaderPanel } from "~/features/video-browser/components/header-panel";
import { SkipLink } from "~/features/video-browser/components/skip-link";
import { VideoCardList } from "~/features/video-browser/components/video-card-list";
import { VideoCardSkeletonGrid } from "~/features/video-browser/components/video-card-skeleton-grid";
import { useVideos } from "~/features/video-browser/hooks/use-videos";
import type { Video, VideoFilters } from "~/features/video-browser/types";
import { deriveFilterOptions } from "~/features/video-browser/utils/derive-filter-options";

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

  // Interim home for the filter values so the controls are operable. The reducer
  // that owns them arrives with the filtering logic itself.
  const [filters, setFilters] = useState<VideoFilters>({
    query: "",
    year: null,
    genreIds: [],
  });

  const options = useMemo(() => deriveFilterOptions(videos), [videos]);

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-5xl flex-col">
      <SkipLink targetId={RESULTS_REGION_ID}>Skip to results</SkipLink>

      <HeaderPanel
        query={filters.query}
        year={filters.year}
        selectedGenreIds={filters.genreIds}
        options={options}
        onQueryChange={(query) =>
          setFilters((current) => ({ ...current, query }))
        }
        onYearChange={(year) => setFilters((current) => ({ ...current, year }))}
        onGenreToggle={(genreId) =>
          setFilters((current) => ({
            ...current,
            genreIds: current.genreIds.includes(genreId)
              ? current.genreIds.filter((id) => id !== genreId)
              : [...current.genreIds, genreId],
          }))
        }
        onGenresClear={() =>
          setFilters((current) => ({ ...current, genreIds: [] }))
        }
      />

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {getAnnouncement(isLoading, Boolean(error), videos.length)}
      </p>

      <div
        id={RESULTS_REGION_ID}
        // A scroll container is not keyboard-scrollable unless it can take focus.
        tabIndex={0}
        role="region"
        aria-label="Video results"
        aria-busy={isLoading}
        className="focus-visible:outline-ink flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        {/*
          Padding sits on the content, not the scroll container, so the scrollbar
          stays flush to the edge while the cards line up with the header.
        */}
        <div className="px-4 pt-1 pb-4">
          <Results
            videos={videos}
            isLoading={isLoading}
            error={error}
            onRetry={retry}
          />
        </div>
      </div>
    </div>
  );
}
