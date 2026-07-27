import Image from "next/image";

import type { Video } from "~/features/video-browser/types";

/** Intrinsic size of every thumbnail in the dataset (`w522_h292`), so 16:9. */
const THUMBNAIL_WIDTH = 522;
const THUMBNAIL_HEIGHT = 292;

/**
 * Matches the grid: full width on mobile, half at `sm`, a third at `lg`. Without
 * this Next would serve desktop-width images to phones for all 500 thumbnails.
 */
const THUMBNAIL_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

interface VideoCardProps {
  video: Video;
  /** Eager-loads the thumbnail. Reserved for the first visible row. */
  isPriority?: boolean;
}

export function VideoCard({
  video,
  isPriority = false,
}: VideoCardProps): React.ReactNode {
  const { title, artist, releaseYear, imageUrl } = video;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Image
        // Decorative: the caption below already states title, artist and year,
        // so describing the image would just make screen readers repeat itself.
        alt=""
        src={imageUrl}
        width={THUMBNAIL_WIDTH}
        height={THUMBNAIL_HEIGHT}
        sizes={THUMBNAIL_SIZES}
        priority={isPriority}
        className="bg-skeleton aspect-video w-full object-cover"
      />
      <div className="bg-caption flex flex-1 flex-col items-center px-3 py-2.5 text-center">
        <p className="text-ink text-xs leading-[1.35]">{title}</p>
        <p className="text-ink text-xs leading-[1.35]">{artist}</p>
        <time
          className="text-ink text-xs leading-[1.35]"
          dateTime={`${releaseYear}`}
        >
          {releaseYear}
        </time>
      </div>
    </div>
  );
}
