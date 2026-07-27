import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { VideoCard } from "~/features/video-browser/components/video-card";
import { findVideo } from "~/features/video-browser/test/fixtures/videos";

describe("VideoCard", () => {
  it("shows the title, artist and release year", () => {
    render(<VideoCard video={findVideo(501437)} />);

    expect(screen.getByText("All In")).toBeInTheDocument();
    expect(screen.getByText("Pants Velour")).toBeInTheDocument();
    expect(screen.getByText("2014")).toBeInTheDocument();
  });

  it("never shows the genre — the brief says it is for filtering only", () => {
    const video = findVideo(501437);

    render(<VideoCard video={video} />);

    expect(video.genreName).toBe("Pop");
    expect(screen.queryByText("Pop")).not.toBeInTheDocument();
  });

  it("renders the numeric-title row without throwing", () => {
    render(<VideoCard video={findVideo(866934)} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Kid3rd")).toBeInTheDocument();
  });

  it("renders a row whose genre could not be resolved", () => {
    const video = findVideo(330002);

    render(<VideoCard video={video} />);

    expect(video.genreName).toBeNull();
    expect(screen.getByText("Personal Jesus")).toBeInTheDocument();
  });

  it("marks the year up as a machine-readable time", () => {
    render(<VideoCard video={findVideo(210001)} />);

    expect(screen.getByText("2008")).toHaveAttribute("datetime", "2008");
  });

  it("treats the thumbnail as decorative, since the caption repeats the same facts", () => {
    render(<VideoCard video={findVideo(501437)} />);

    // Empty alt means the image is excluded from the accessibility tree, so it
    // must not be reachable by role.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByAltText("")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<VideoCard video={findVideo(501437)} />);

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
