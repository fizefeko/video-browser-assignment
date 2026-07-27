"use client";

import {
  EMPTY_STATE_MESSAGE,
  EmptyState,
} from "~/features/video-browser/components/empty-state";
import { ErrorState } from "~/features/video-browser/components/error-state";
import { VideoCardList } from "~/features/video-browser/components/video-card-list";
import { VideoCardSkeletonGrid } from "~/features/video-browser/components/video-card-skeleton-grid";
import { useVideos } from "~/features/video-browser/hooks/use-videos";
import type { Video } from "~/features/video-browser/types";

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

  return (
    <div className="mx-auto flex h-dvh w-full max-w-5xl flex-col">
      <header className="border-hairline shrink-0 border-b px-4 py-4">
        <h1 className="text-ink text-center text-xl font-bold tracking-tight">
          Video Browser
        </h1>
      </header>

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {getAnnouncement(isLoading, Boolean(error), videos.length)}
      </p>

      <div
        // A scroll container is not keyboard-scrollable unless it can take focus.
        tabIndex={0}
        role="region"
        aria-label="Video results"
        aria-busy={isLoading}
        className="focus-visible:outline-ink flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <Results
          videos={videos}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
        />
      </div>
    </div>
  );
}
