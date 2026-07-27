import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { VideoBrowser } from "~/features/video-browser/components/video-browser";
import {
  useVideos,
  type UseVideosResult,
} from "~/features/video-browser/hooks/use-videos";
import { videos } from "~/features/video-browser/test/fixtures/videos";

jest.mock("~/features/video-browser/hooks/use-videos", () => ({
  useVideos: jest.fn(),
}));

const mockUseVideos = useVideos as jest.MockedFunction<typeof useVideos>;

const retry = jest.fn();

function givenVideosState(overrides: Partial<UseVideosResult> = {}): void {
  mockUseVideos.mockReturnValue({
    videos,
    genres: [],
    isLoading: false,
    error: undefined,
    retry,
    ...overrides,
  });
}

function getLiveRegion(): HTMLElement {
  const region = document.querySelector("[aria-live='polite']");

  if (!(region instanceof HTMLElement)) {
    throw new Error("No polite live region rendered");
  }

  return region;
}

describe("VideoBrowser", () => {
  it("renders the application title as the page heading", () => {
    givenVideosState();
    render(<VideoBrowser />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Video Browser" })
    ).toBeInTheDocument();
  });

  it("puts the results in a focusable, labelled scroll region", () => {
    givenVideosState();
    render(<VideoBrowser />);

    const region = screen.getByRole("region", { name: "Video results" });

    // Without a tab stop, keyboard users cannot scroll an overflow container.
    expect(region).toHaveAttribute("tabindex", "0");
  });

  describe("while loading", () => {
    it("marks the region busy and announces progress", () => {
      givenVideosState({ isLoading: true, videos: [] });
      render(<VideoBrowser />);

      expect(
        screen.getByRole("region", { name: "Video results" })
      ).toHaveAttribute("aria-busy", "true");
      expect(getLiveRegion()).toHaveTextContent("Loading videos");
    });

    it("hides the placeholder grid from assistive technology", () => {
      givenVideosState({ isLoading: true, videos: [] });
      render(<VideoBrowser />);

      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("has no accessibility violations", async () => {
      givenVideosState({ isLoading: true, videos: [] });
      const { container } = render(<VideoBrowser />);

      await expect(axe(container)).resolves.toHaveNoViolations();
    });
  });

  describe("on failure", () => {
    it("announces the error assertively and offers a retry", async () => {
      const user = userEvent.setup();
      givenVideosState({ error: new Error("Upstream is down"), videos: [] });
      render(<VideoBrowser />);

      expect(screen.getByRole("alert")).toHaveTextContent("Upstream is down");

      await user.click(screen.getByRole("button", { name: "Try again" }));

      expect(retry).toHaveBeenCalledTimes(1);
    });

    it("does not repeat the failure in the polite region", () => {
      givenVideosState({ error: new Error("Upstream is down"), videos: [] });
      render(<VideoBrowser />);

      expect(getLiveRegion()).toHaveTextContent("");
    });

    it("has no accessibility violations", async () => {
      givenVideosState({ error: new Error("Upstream is down"), videos: [] });
      const { container } = render(<VideoBrowser />);

      await expect(axe(container)).resolves.toHaveNoViolations();
    });
  });

  describe("with no matches", () => {
    it("shows the exact copy from the brief", () => {
      givenVideosState({ videos: [] });
      render(<VideoBrowser />);

      // Scoped to the results area: the permanently-mounted live region carries
      // the same string, so an unscoped query matches twice.
      const region = screen.getByRole("region", { name: "Video results" });

      expect(
        within(region).getByText("No videos were found")
      ).toBeInTheDocument();
    });

    it("announces the empty result", () => {
      givenVideosState({ videos: [] });
      render(<VideoBrowser />);

      expect(getLiveRegion()).toHaveTextContent("No videos were found");
    });
  });

  describe("with results", () => {
    it("renders the grid", () => {
      givenVideosState();
      render(<VideoBrowser />);

      expect(screen.getAllByRole("listitem")).toHaveLength(videos.length);
    });

    it("announces the result count", () => {
      givenVideosState();
      render(<VideoBrowser />);

      expect(getLiveRegion()).toHaveTextContent(
        `${videos.length} videos found`
      );
    });

    it("uses the singular form for a single result", () => {
      givenVideosState({ videos: videos.slice(0, 1) });
      render(<VideoBrowser />);

      expect(getLiveRegion()).toHaveTextContent("1 video found");
    });

    it("has no accessibility violations", async () => {
      givenVideosState();
      const { container } = render(<VideoBrowser />);

      await expect(axe(container)).resolves.toHaveNoViolations();
    });
  });
});
