import { render, screen, waitFor, within } from "@testing-library/react";
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

function goTo(search: string): void {
  window.history.replaceState(null, "", `/${search}`);
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

  it("puts the results in a focusable, labelled scroll region", () => {
    givenVideosState();
    render(<VideoBrowser />);

    const region = screen.getByRole("region", { name: "Video results" });

    // Without a tab stop, keyboard users cannot scroll an overflow container.
    expect(region).toHaveAttribute("tabindex", "0");
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
