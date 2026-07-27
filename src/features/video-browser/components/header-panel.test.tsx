import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  APP_TITLE,
  HeaderPanel,
} from "~/features/video-browser/components/header-panel";
import { SEARCH_LABEL } from "~/features/video-browser/components/video-search-input";
import { YEAR_LABEL } from "~/features/video-browser/components/year-select";
import type { FilterOptions } from "~/features/video-browser/types";

const options: FilterOptions = {
  years: [2017, 2014, 2008],
  genres: [
    { id: 5, name: "Pop" },
    { id: 8, name: "Rock" },
  ],
};

type Handlers = Pick<
  React.ComponentProps<typeof HeaderPanel>,
  "onQueryChange" | "onYearChange" | "onGenreToggle" | "onGenresClear"
>;

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof HeaderPanel>> = {}
): Handlers {
  const handlers = {
    onQueryChange: jest.fn(),
    onYearChange: jest.fn(),
    onGenreToggle: jest.fn(),
    onGenresClear: jest.fn(),
  };

  render(
    <HeaderPanel
      query=""
      year={null}
      selectedGenreIds={[]}
      options={options}
      {...handlers}
      {...overrides}
    />
  );

  return handlers;
}

describe("HeaderPanel", () => {
  it("shows the application title as the top-level heading", () => {
    renderPanel();

    expect(
      screen.getByRole("heading", { level: 1, name: APP_TITLE })
    ).toBeInTheDocument();
  });

  it("is a header landmark", () => {
    renderPanel();

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders all three filters, each with an accessible name", () => {
    renderPanel();

    expect(
      screen.getByRole("searchbox", { name: SEARCH_LABEL })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: YEAR_LABEL })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
  });

  it("passes the current filter values down to the controls", () => {
    renderPanel({ query: "Beyonce", year: 2008, selectedGenreIds: [5, 8] });

    expect(screen.getByRole("searchbox")).toHaveValue("Beyonce");
    expect(screen.getByRole("combobox")).toHaveTextContent("2008");
    expect(screen.getByRole("button")).toHaveTextContent("2 genres selected");
  });

  it("offers the year options it is given", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("combobox"));

    // Three years plus the clear option.
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("forwards typing to the query handler", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = renderPanel();

    await user.type(screen.getByRole("searchbox"), "R");

    expect(onQueryChange).toHaveBeenCalledWith("R");
  });

  it("forwards a year choice", async () => {
    const user = userEvent.setup();
    const { onYearChange } = renderPanel();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "2014" }));

    expect(onYearChange).toHaveBeenCalledWith(2014);
  });

  it("forwards a genre toggle", async () => {
    const user = userEvent.setup();
    const { onGenreToggle } = renderPanel();

    await user.click(screen.getByRole("button", { expanded: false }));
    await user.click(screen.getByRole("checkbox", { name: "Rock" }));

    expect(onGenreToggle).toHaveBeenCalledWith(8);
  });

  it("reaches every control by keyboard in visual order", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.tab();
    expect(screen.getByRole("searchbox")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("combobox")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { expanded: false })).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    renderPanel();

    await expect(axe(document.body)).resolves.toHaveNoViolations();
  });
});
