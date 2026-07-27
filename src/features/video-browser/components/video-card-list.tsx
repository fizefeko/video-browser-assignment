import { VideoCard } from "~/features/video-browser/components/video-card";
import type { Video } from "~/features/video-browser/types";

/** One desktop row — these thumbnails load eagerly, the rest lazily. */
const PRIORITY_CARD_COUNT = 3;

/**
 * Cards past this index share the last delay. Without a cap, a 500-card render
 * would schedule a twelve-second stagger.
 */
const STAGGER_CAP = 9;

const STAGGER_STEP_MS = 25;

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
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {videos.map((video, index) => (
        <li
          // Keyed by id, so narrowing a filter leaves surviving cards mounted and
          // only genuinely new cards animate in.
          key={video.id}
          className="animate-card-enter motion-reduce:animate-none"
          style={{
            animationDelay: `${Math.min(index, STAGGER_CAP) * STAGGER_STEP_MS}ms`,
          }}
        >
          <VideoCard video={video} isPriority={index < PRIORITY_CARD_COUNT} />
        </li>
      ))}
    </ul>
  );
}
