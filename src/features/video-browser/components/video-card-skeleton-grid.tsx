/** Enough to fill a typical viewport without pretending to know the real count. */
const SKELETON_COUNT = 9;

const SKELETON_KEYS = Array.from(
  { length: SKELETON_COUNT },
  (_, index) => `skeleton-${index}`
);

function VideoCardSkeleton(): React.ReactNode {
  return (
    <div className="flex h-full animate-pulse flex-col overflow-hidden">
      <div className="bg-skeleton aspect-video w-full" />
      <div className="bg-caption flex flex-1 flex-col items-center gap-1.5 px-3 py-3.5">
        <div className="bg-skeleton h-2 w-2/3 rounded" />
        <div className="bg-skeleton h-2 w-1/2 rounded" />
        <div className="bg-skeleton h-2 w-8 rounded" />
      </div>
    </div>
  );
}

/**
 * Placeholder grid shown while the dataset loads. Hidden from assistive tech —
 * the live region announces "Loading videos" instead, which is far more useful
 * than nine sets of empty boxes.
 */
export function VideoCardSkeletonGrid(): React.ReactNode {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {SKELETON_KEYS.map((key) => (
        <VideoCardSkeleton key={key} />
      ))}
    </div>
  );
}
