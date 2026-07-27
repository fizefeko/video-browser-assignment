import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  GENRE_PLACEHOLDER,
  GenreMultiSelect,
} from "~/features/video-browser/components/genre-multi-select";
import type { Genre } from "~/features/video-browser/types";

const genres: Array<Genre> = [
  { id: 5, name: "Pop" },
  { id: 8, name: "Rock" },
  { id: 14, name: "Rap/Hip-Hop" },
];

interface Handlers {
  onToggle: jest.Mock;
  onClear: jest.Mock;
}

function renderSelect(selectedIds: Array<number> = []): Handlers {
  const onToggle = jest.fn();
  const onClear = jest.fn();

  render(
    <GenreMultiSelect
      genres={genres}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
    />
  );

  return { onToggle, onClear };
}

function getTrigger(): HTMLElement {
  return screen.getByRole("button", { expanded: false });
}

describe("GenreMultiSelect", () => {
  it("starts collapsed showing the placeholder", () => {
    renderSelect();

    expect(getTrigger()).toHaveTextContent(GENRE_PLACEHOLDER);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("states the selection count as visible text, not only to screen readers", () => {
    renderSelect([5, 8]);

    expect(screen.getByRole("button")).toHaveTextContent("2 genres selected");
  });

  it("uses the singular form for one selection", () => {
    renderSelect([5]);

    expect(screen.getByRole("button")).toHaveTextContent("1 genre selected");
  });

  it("lists a checkbox per genre once opened", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(getTrigger());

    expect(screen.getAllByRole("checkbox")).toHaveLength(genres.length);
    expect(screen.getByRole("checkbox", { name: "Rock" })).toBeInTheDocument();
  });

  it("reflects which genres are already selected", async () => {
    const user = userEvent.setup();
    renderSelect([8]);

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("checkbox", { name: "Rock" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Pop" })).not.toBeChecked();
  });

  it("reports a toggle rather than a replacement, so multiple genres can stack", async () => {
    const user = userEvent.setup();
    const { onToggle } = renderSelect([5]);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("checkbox", { name: "Rock" }));

    expect(onToggle).toHaveBeenCalledWith(8);
  });

  it("toggles an already-selected genre back off", async () => {
    const user = userEvent.setup();
    const { onToggle } = renderSelect([5]);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("checkbox", { name: "Pop" }));

    expect(onToggle).toHaveBeenCalledWith(5);
  });

  it("offers a clear action once something is selected", async () => {
    const user = userEvent.setup();
    const { onClear } = renderSelect([5, 8]);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("disables the clear action when there is nothing to clear", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(getTrigger());

    expect(
      screen.getByRole("button", { name: "Clear selection" })
    ).toBeDisabled();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderSelect();
    const trigger = getTrigger();

    await user.click(trigger);
    expect(screen.getAllByRole("checkbox")).toHaveLength(genres.length);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens from the keyboard alone", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.tab();
    expect(getTrigger()).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(screen.getAllByRole("checkbox")).toHaveLength(genres.length);
  });

  it("groups the options so their shared purpose is announced", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(getTrigger());

    expect(
      screen.getByRole("group", { name: "Genre filter" })
    ).toBeInTheDocument();
  });

  it("has no accessibility violations when collapsed", async () => {
    const { container } = render(
      <GenreMultiSelect
        genres={genres}
        selectedIds={[]}
        onToggle={jest.fn()}
        onClear={jest.fn()}
      />
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <GenreMultiSelect
        genres={genres}
        selectedIds={[5]}
        onToggle={jest.fn()}
        onClear={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button"));

    await expect(axe(baseElement)).resolves.toHaveNoViolations();
  });
});
