import { VideoBrowser } from "~/features/video-browser/components/video-browser";

export default function Home(): React.ReactNode {
  return (
    <main className="min-h-dvh">
      <VideoBrowser />
    </main>
  );
}
