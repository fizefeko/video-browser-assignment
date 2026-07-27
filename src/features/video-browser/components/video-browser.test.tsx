import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { VideoBrowser } from "~/features/video-browser/components/video-browser";
import {
  useVideos,
  type UseVideosResult,
} from "~/features/video-browser/hooks/use-videos";
import { videos } from "~/features/video-browser/test/fixtures/videos";
import type { Video } from "~/features/video-browser/types";

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

function goTo(search: string): void {
  window.history.replaceState(null, "", `/${search}`);
}

/** Enough videos to need more than one page. */
function makeVideos(count: number): Array<Video> {
  const [template] = videos;

  if (!template) {
    throw new Error("The video fixture is empty");
  }

  return Array.from({ length: count }, (_, index) => ({
    ...template,
    id: 900000 + index,
    title: `Video ${index}`,
    searchTitle: `video ${index}`,
  }));
}

beforeEach(() => {
  goTo("");
});

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

  it("labels the results as a region without adding a tab stop", () => {
    givenVideosState();
    render(<VideoBrowser />);

    const region = screen.getByRole("region", { name: "Video results" });

    // The page scrolls, so arrow keys already work; -1 keeps the region
    // programmatically focusable for the skip link without a pointless tab stop.
    expect(region).toHaveAttribute("tabindex", "-1");
  });

  it("does not put the results region in the tab order", async () => {
    const user = userEvent.setup();
    givenVideosState();
    render(<VideoBrowser />);

    await user.tab(); // skip link
    await user.tab(); // search
    await user.tab(); // year
    await user.tab(); // genre trigger

    expect(screen.getByRole("button", { expanded: false })).toHaveFocus();

    await user.tab();

    expect(
      screen.getByRole("region", { name: "Video results" })
    ).not.toHaveFocus();
  });

  describe("filter controls", () => {
    it("offers a skip link straight to the results", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.tab();

      const skipLink = screen.getByRole("link", { name: "Skip to results" });
      const region = screen.getByRole("region", { name: "Video results" });

      expect(skipLink).toHaveFocus();
      expect(skipLink).toHaveAttribute("href", `#${region.id}`);
    });

    it("builds the year options from the loaded videos", () => {
      givenVideosState();
      render(<VideoBrowser />);

      // The four fixture years, plus the clear option.
      expect(screen.getAllByRole("option")).toHaveLength(5);
    });

    it("offers only genres that some video actually uses", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { expanded: false }));

      expect(
        screen.getAllByRole("checkbox").map((box) => box.getAttribute("name"))
      ).toHaveLength(2);
    });

    it("keeps what the user typed", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "Beyonce");

      expect(screen.getByRole("searchbox")).toHaveValue("Beyonce");
    });

    it("keeps the chosen year", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.selectOptions(screen.getByRole("combobox"), "2008");

      expect(screen.getByRole("combobox")).toHaveValue("2008");
    });

    it("accumulates genre selections instead of replacing them", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { expanded: false }));
      await user.click(screen.getByRole("checkbox", { name: "Pop" }));
      await user.click(screen.getByRole("checkbox", { name: "Rock" }));

      expect(screen.getByRole("checkbox", { name: "Pop" })).toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Rock" })).toBeChecked();
    });

    it("cannot select the same genre twice", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { expanded: false }));
      await user.click(screen.getByRole("checkbox", { name: "Pop" }));
      await user.click(screen.getByRole("checkbox", { name: "Pop" }));

      expect(screen.getByRole("checkbox", { name: "Pop" })).not.toBeChecked();
    });

    it("clears every genre selection at once", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { expanded: false }));
      await user.click(screen.getByRole("checkbox", { name: "Pop" }));
      await user.click(screen.getByRole("checkbox", { name: "Rock" }));
      await user.click(screen.getByRole("button", { name: "Clear selection" }));

      expect(screen.getByRole("checkbox", { name: "Pop" })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Rock" })).not.toBeChecked();
    });
  });

  describe("pagination", () => {
    it("renders only the first twelve videos", () => {
      givenVideosState({ videos: makeVideos(30) });
      render(<VideoBrowser />);

      expect(screen.getAllByRole("listitem")).toHaveLength(12);
    });

    it("offers to load the next page and says how many remain", () => {
      givenVideosState({ videos: makeVideos(30) });
      render(<VideoBrowser />);

      expect(
        screen.getByRole("button", { name: "Load 12 more videos" })
      ).toBeInTheDocument();
      expect(screen.getByText("18 videos remaining")).toBeInTheDocument();
    });

    it("appends the next page without losing the previous one", async () => {
      const user = userEvent.setup();
      givenVideosState({ videos: makeVideos(30) });
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { name: /Load 12 more/ }));

      expect(screen.getAllByRole("listitem")).toHaveLength(24);
      expect(screen.getByText("Video 0")).toBeInTheDocument();
      expect(screen.getByText("Video 23")).toBeInTheDocument();
    });

    it("offers only what is left on the final page", async () => {
      const user = userEvent.setup();
      givenVideosState({ videos: makeVideos(20) });
      render(<VideoBrowser />);

      expect(
        screen.getByRole("button", { name: "Load 8 more videos" })
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Load 8 more/ }));

      expect(screen.getAllByRole("listitem")).toHaveLength(20);
    });

    it("removes the control once everything is shown", async () => {
      const user = userEvent.setup();
      givenVideosState({ videos: makeVideos(20) });
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { name: /Load 8 more/ }));

      expect(
        screen.queryByRole("button", { name: /Load .* more/ })
      ).not.toBeInTheDocument();
    });

    it("shows no control when everything fits on one page", () => {
      givenVideosState({ videos: makeVideos(5) });
      render(<VideoBrowser />);

      expect(screen.getAllByRole("listitem")).toHaveLength(5);
      expect(
        screen.queryByRole("button", { name: /Load .* more/ })
      ).not.toBeInTheDocument();
    });

    it("announces both what is shown and what matched", () => {
      givenVideosState({ videos: makeVideos(30) });
      render(<VideoBrowser />);

      expect(getLiveRegion()).toHaveTextContent("Showing 12 of 30 videos");
    });

    it("announces the plain total once nothing is held back", async () => {
      const user = userEvent.setup();
      givenVideosState({ videos: makeVideos(20) });
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { name: /Load 8 more/ }));

      expect(getLiveRegion()).toHaveTextContent("20 videos found");
    });

    it("has no accessibility violations while a page is held back", async () => {
      givenVideosState({ videos: makeVideos(30) });
      const { container } = render(<VideoBrowser />);

      await expect(axe(container)).resolves.toHaveNoViolations();
    });
  });

  describe("filtering", () => {
    it("narrows the grid as the user types", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "beyonce");

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(
        screen.getByText("Single Ladies (Put a Ring on It)")
      ).toBeInTheDocument();
    });

    it("matches on artist as well as title", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "Pants Velour");

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.getByText("All In")).toBeInTheDocument();
    });

    it("shows the empty state when nothing matches", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "zzzz no such video");

      const region = screen.getByRole("region", { name: "Video results" });

      expect(
        within(region).getByText("No videos were found")
      ).toBeInTheDocument();
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });

    it("filters by year", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.selectOptions(screen.getByRole("combobox"), "2014");

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.getByText("All In")).toBeInTheDocument();
    });

    it("filters by genre", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { expanded: false }));
      await user.click(screen.getByRole("checkbox", { name: "Rock" }));
      await user.keyboard("{Escape}");

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(
        screen.getByText("Single Ladies (Put a Ring on It)")
      ).toBeInTheDocument();
    });

    it("combines all three filters with AND", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "beyonce");
      await user.selectOptions(screen.getByRole("combobox"), "2008");
      await user.click(screen.getByRole("button", { expanded: false }));
      await user.click(screen.getByRole("checkbox", { name: "Rock" }));
      await user.keyboard("{Escape}");

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });

    it("returns nothing when the filters contradict each other", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      // Year first: typing first would narrow 2014 out of the options entirely,
      // which is the dynamic-options behaviour rather than a contradiction.
      await user.selectOptions(screen.getByRole("combobox"), "2014");
      await user.type(screen.getByRole("searchbox"), "beyonce");

      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });

    it("announces the filtered count, not the total", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "beyonce");

      expect(getLiveRegion()).toHaveTextContent("1 video found");
    });

    it("announces the empty result", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "zzzz");

      expect(getLiveRegion()).toHaveTextContent("No videos were found");
    });

    it("narrows the year options to what the search can return", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "beyonce");

      expect(
        screen.getAllByRole("option").map((option) => option.textContent)
      ).toEqual(["All years", "2008"]);
    });

    it("keeps a chosen year listed once the search excludes it", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.selectOptions(screen.getByRole("combobox"), "2014");
      await user.type(screen.getByRole("searchbox"), "beyonce");

      // The select must never hold a value it does not offer.
      expect(screen.getByRole("combobox")).toHaveValue("2014");
      expect(
        screen.getAllByRole("option").map((option) => option.textContent)
      ).toContain("2014");
    });

    it("reflects the filters in the address bar", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "beyonce");
      await user.selectOptions(screen.getByRole("combobox"), "2008");

      expect(window.location.search).toBe("?q=beyonce&year=2008");
    });

    it("clears the address bar again when filters are removed", async () => {
      const user = userEvent.setup();
      givenVideosState();
      render(<VideoBrowser />);

      await user.selectOptions(screen.getByRole("combobox"), "2014");
      expect(window.location.search).toBe("?year=2014");

      await user.selectOptions(screen.getByRole("combobox"), "");

      expect(window.location.search).toBe("");
    });

    it("applies filters supplied by a deep link", async () => {
      goTo("?q=beyonce&year=2008&genres=8");
      givenVideosState();
      render(<VideoBrowser />);

      await waitFor(() => {
        expect(screen.getByRole("searchbox")).toHaveValue("beyonce");
      });
      expect(screen.getByRole("combobox")).toHaveValue("2008");
      expect(screen.getByRole("button", { expanded: false })).toHaveTextContent(
        "1 genre selected"
      );
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });

    it("ignores a deep-linked genre that does not exist, without crashing", async () => {
      goTo("?genres=999999");
      givenVideosState();
      render(<VideoBrowser />);

      const region = screen.getByRole("region", { name: "Video results" });

      await waitFor(() => {
        expect(
          within(region).getByText("No videos were found")
        ).toBeInTheDocument();
      });
    });

    it("resets to the first page when a filter changes", async () => {
      const user = userEvent.setup();
      givenVideosState({ videos: makeVideos(30) });
      render(<VideoBrowser />);

      await user.click(screen.getByRole("button", { name: /Load 12 more/ }));
      expect(screen.getAllByRole("listitem")).toHaveLength(24);

      // Matches all 30, so the change is purely the reset.
      await user.type(screen.getByRole("searchbox"), "video");

      expect(screen.getAllByRole("listitem")).toHaveLength(12);
    });

    it("has no accessibility violations with the empty state showing", async () => {
      const user = userEvent.setup();
      givenVideosState();
      const { container } = render(<VideoBrowser />);

      await user.type(screen.getByRole("searchbox"), "zzzz");

      await expect(axe(container)).resolves.toHaveNoViolations();
    });
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

    it("falls back to a readable message when the error carries none", () => {
      // Network failures sometimes surface as an Error with an empty message.
      givenVideosState({ error: new Error(""), videos: [] });
      render(<VideoBrowser />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not load videos. Please try again."
      );
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
