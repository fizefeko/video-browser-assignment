import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { VideoCardList } from "~/features/video-browser/components/video-card-list";
import { videos } from "~/features/video-browser/test/fixtures/videos";

describe("VideoCardList", () => {
  it("renders one list item per video", () => {
    render(<VideoCardList videos={videos} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(videos.length);
  });

  it("exposes list semantics so screen readers announce the item count", () => {
    render(<VideoCardList videos={videos} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("renders an empty list without crashing", () => {
    render(<VideoCardList videos={[]} />);

    expect(screen.getByRole("list")).toBeEmptyDOMElement();
  });

  it("eager-loads only the first row of thumbnails", () => {
    render(<VideoCardList videos={videos} />);

    const images = screen.getAllByAltText("");
    const eager = images.filter(
      (image) => image.getAttribute("loading") !== "lazy"
    );

    expect(eager).toHaveLength(3);
    expect(images).toHaveLength(videos.length);
  });

  it("describes the real rendered width, not the viewport fraction", () => {
    render(<VideoCardList videos={videos} />);

    // Past the container's max width a card is a fixed 320px, so a vw-based
    // hint here would make Next fetch sources wider than the slot.
    expect(screen.getAllByAltText("")[0]).toHaveAttribute(
      "sizes",
      "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<VideoCardList videos={videos} />);

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
