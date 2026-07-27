import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  SEARCH_LABEL,
  VideoSearchInput,
} from "~/features/video-browser/components/video-search-input";

describe("VideoSearchInput", () => {
  it("is reachable by its accessible name, not just its placeholder", () => {
    render(<VideoSearchInput value="" onChange={jest.fn()} />);

    expect(
      screen.getByRole("searchbox", { name: SEARCH_LABEL })
    ).toBeInTheDocument();
  });

  it("keeps the placeholder from the mockup", () => {
    render(<VideoSearchInput value="" onChange={jest.fn()} />);

    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "placeholder",
      "Search Video..."
    );
  });

  it("displays the value it is given", () => {
    render(<VideoSearchInput value="John Mayer" onChange={jest.fn()} />);

    expect(screen.getByRole("searchbox")).toHaveValue("John Mayer");
  });

  it("reports every keystroke, so filtering can happen without a submit", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<VideoSearchInput value="" onChange={onChange} />);

    await user.type(screen.getByRole("searchbox"), "abc");

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, "a");
  });

  it("clicking the label focuses the field", async () => {
    const user = userEvent.setup();
    render(<VideoSearchInput value="" onChange={jest.fn()} />);

    await user.click(screen.getByText(SEARCH_LABEL));

    expect(screen.getByRole("searchbox")).toHaveFocus();
  });

  it("disables browser autocomplete, as the brief requires", () => {
    render(<VideoSearchInput value="" onChange={jest.fn()} />);

    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "autocomplete",
      "off"
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <VideoSearchInput value="" onChange={jest.fn()} />
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
