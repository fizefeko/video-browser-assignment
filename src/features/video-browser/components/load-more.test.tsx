import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { LoadMore } from "~/features/video-browser/components/load-more";

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

const observe = jest.fn();
const disconnect = jest.fn();
let latestCallback: ObserverCallback | null = null;
let constructedCount = 0;

class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    latestCallback = callback;
    constructedCount += 1;
  }

  observe = observe;
  disconnect = disconnect;
  unobserve = jest.fn();
  takeRecords = jest.fn();
}

beforeEach(() => {
  latestCallback = null;
  constructedCount = 0;
  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

function scrollSentinelIntoView(): void {
  latestCallback?.([{ isIntersecting: true }]);
}

describe("LoadMore", () => {
  it("offers a button, so loading more does not require scrolling", async () => {
    const user = userEvent.setup();
    const onLoadMore = jest.fn();
    render(
      <LoadMore remaining={28} nextPageSize={12} onLoadMore={onLoadMore} />
    );

    await user.click(
      screen.getByRole("button", { name: "Load 12 more videos" })
    );

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("is reachable and operable by keyboard alone", async () => {
    const user = userEvent.setup();
    const onLoadMore = jest.fn();
    render(<LoadMore remaining={5} nextPageSize={5} onLoadMore={onLoadMore} />);

    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("says how many the next page adds, not the page size", () => {
    render(<LoadMore remaining={3} nextPageSize={3} onLoadMore={jest.fn()} />);

    expect(
      screen.getByRole("button", { name: "Load 3 more videos" })
    ).toBeInTheDocument();
  });

  it.each([
    [1, "Load 1 more video"],
    [2, "Load 2 more videos"],
  ])("uses the right plural for %i", (nextPageSize, expected) => {
    render(
      <LoadMore
        remaining={nextPageSize}
        nextPageSize={nextPageSize}
        onLoadMore={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: expected })).toBeInTheDocument();
  });

  it("states how many remain, so the count is visible and not only announced", () => {
    render(
      <LoadMore remaining={28} nextPageSize={12} onLoadMore={jest.fn()} />
    );

    expect(screen.getByText("28 videos remaining")).toBeInTheDocument();
  });

  it("uses the singular for a single remaining video", () => {
    render(<LoadMore remaining={1} nextPageSize={1} onLoadMore={jest.fn()} />);

    expect(screen.getByText("1 video remaining")).toBeInTheDocument();
  });

  describe("scroll-triggered loading", () => {
    it("loads more once the sentinel comes into view", () => {
      const onLoadMore = jest.fn();
      render(
        <LoadMore remaining={28} nextPageSize={12} onLoadMore={onLoadMore} />
      );

      expect(observe).toHaveBeenCalled();

      scrollSentinelIntoView();

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it("ignores the sentinel leaving the viewport", () => {
      const onLoadMore = jest.fn();
      render(
        <LoadMore remaining={28} nextPageSize={12} onLoadMore={onLoadMore} />
      );

      latestCallback?.([{ isIntersecting: false }]);

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it("builds a single observer even as the callback changes each page", () => {
      const { rerender } = render(
        <LoadMore remaining={28} nextPageSize={12} onLoadMore={jest.fn()} />
      );

      rerender(
        <LoadMore remaining={16} nextPageSize={12} onLoadMore={jest.fn()} />
      );
      rerender(
        <LoadMore remaining={4} nextPageSize={4} onLoadMore={jest.fn()} />
      );

      // Rebuilding it would re-report the sentinel's current state and cascade
      // through the whole list in one go.
      expect(constructedCount).toBe(1);
    });

    it("calls the newest callback, not the one captured at mount", () => {
      const first = jest.fn();
      const second = jest.fn();
      const { rerender } = render(
        <LoadMore remaining={28} nextPageSize={12} onLoadMore={first} />
      );

      rerender(
        <LoadMore remaining={16} nextPageSize={12} onLoadMore={second} />
      );
      scrollSentinelIntoView();

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("stops observing when unmounted", () => {
      const { unmount } = render(
        <LoadMore remaining={28} nextPageSize={12} onLoadMore={jest.fn()} />
      );

      unmount();

      expect(disconnect).toHaveBeenCalled();
    });

    it("still renders where IntersectionObserver is unavailable", () => {
      // @ts-expect-error -- deliberately removing the global for this case.
      delete global.IntersectionObserver;

      render(
        <LoadMore remaining={28} nextPageSize={12} onLoadMore={jest.fn()} />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <LoadMore remaining={28} nextPageSize={12} onLoadMore={jest.fn()} />
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
