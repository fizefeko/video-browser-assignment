import { VideoCard } from "~/features/video-browser/components/video-card";
import type { Video } from "~/features/video-browser/types";

/** One desktop row — these thumbnails load eagerly, the rest lazily. */
const PRIORITY_CARD_COUNT = 3;

interface VideoCardListProps {
  videos: Array<Video>;
}

/**
 * The grid. `role="list"` is explicit because Tailwind's reset removes list
 * markers, and Safari/VoiceOver drop list semantics along with them.
 */
export function VideoCardList({ videos }: VideoCardListProps): React.ReactNode {
  return (
    <ul
      role="list"
      className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {videos.map((video, index) => (
        <li key={video.id}>
          <VideoCard video={video} isPriority={index < PRIORITY_CARD_COUNT} />
        </li>
      ))}
    </ul>
  );
}
