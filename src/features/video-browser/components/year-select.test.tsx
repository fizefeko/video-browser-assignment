import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  ALL_YEARS_LABEL,
  YEAR_LABEL,
  YearSelect,
} from "~/features/video-browser/components/year-select";

const years = [2017, 2014, 2008, 1991];

function getTrigger(): HTMLElement {
  return screen.getByRole("combobox", { name: YEAR_LABEL });
}

async function open(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(getTrigger());
}

describe("YearSelect", () => {
  it("is reachable by its accessible name", () => {
    render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

    expect(getTrigger()).toBeInTheDocument();
  });

  it("shows all years as the resting state", () => {
    render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

    expect(getTrigger()).toHaveTextContent(ALL_YEARS_LABEL);
  });

  it("shows the selected year on the trigger", () => {
    render(<YearSelect years={years} value={2014} onChange={jest.fn()} />);

    expect(getTrigger()).toHaveTextContent("2014");
  });

  it("keeps the options out of the document until opened", () => {
    render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("offers every year plus a way to clear the filter", async () => {
    const user = userEvent.setup();
    render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

    await open(user);

    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual([ALL_YEARS_LABEL, "2017", "2014", "2008", "1991"]);
  });

  it("reports a chosen year as a number, not a string", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<YearSelect years={years} value={null} onChange={onChange} />);

    await open(user);
    await user.click(screen.getByRole("option", { name: "2008" }));

    expect(onChange).toHaveBeenCalledWith(2008);
  });

  it("reports clearing as null rather than its internal sentinel", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<YearSelect years={years} value={2008} onChange={onChange} />);

    await open(user);
    await user.click(screen.getByRole("option", { name: ALL_YEARS_LABEL }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("marks the current selection as checked", async () => {
    const user = userEvent.setup();
    render(<YearSelect years={years} value={2014} onChange={jest.fn()} />);

    await open(user);

    expect(screen.getByRole("option", { name: "2014" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  describe("keyboard", () => {
    it("is reachable by Tab", async () => {
      const user = userEvent.setup();
      render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

      await user.tab();

      expect(getTrigger()).toHaveFocus();
    });

    it("opens without a pointer", async () => {
      const user = userEvent.setup();
      render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

      await user.tab();
      await user.keyboard("{Enter}");

      expect(screen.getAllByRole("option")).toHaveLength(years.length + 1);
    });

    it("closes on Escape and returns focus to the trigger", async () => {
      const user = userEvent.setup();
      render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

      await open(user);
      expect(screen.getAllByRole("option")).not.toHaveLength(0);

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("option")).not.toBeInTheDocument();
      expect(getTrigger()).toHaveFocus();
    });
  });

  it("renders with no years without losing the clear option", async () => {
    const user = userEvent.setup();
    render(<YearSelect years={[]} value={null} onChange={jest.fn()} />);

    await open(user);

    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("has no accessibility violations when closed", async () => {
    const { container } = render(
      <YearSelect years={years} value={null} onChange={jest.fn()} />
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <YearSelect years={years} value={2014} onChange={jest.fn()} />
    );

    await open(user);

    /*
     * The `region` rule is switched off here only. It asks that all page content
     * sit inside a landmark, which is a page-level concern: this test renders one
     * control with no surrounding page, and the listbox is portaled to the body.
     * VideoBrowser's own axe assertions cover the real page, landmarks included.
     */
    await expect(
      axe(baseElement, { rules: { region: { enabled: false } } })
    ).resolves.toHaveNoViolations();
  });
});
