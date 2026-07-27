import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  ALL_YEARS_LABEL,
  YEAR_LABEL,
  YearSelect,
} from "~/features/video-browser/components/year-select";

const years = [2017, 2014, 2008, 1991];

describe("YearSelect", () => {
  it("is reachable by its accessible name", () => {
    render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

    expect(
      screen.getByRole("combobox", { name: YEAR_LABEL })
    ).toBeInTheDocument();
  });

  it("offers every year plus a way to clear the filter", () => {
    render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual([ALL_YEARS_LABEL, "2017", "2014", "2008", "1991"]);
  });

  it("shows no year selected as the clear option", () => {
    render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("reflects the selected year", () => {
    render(<YearSelect years={years} value={2014} onChange={jest.fn()} />);

    expect(screen.getByRole("combobox")).toHaveValue("2014");
  });

  it("reports a chosen year as a number, not a string", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<YearSelect years={years} value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "2008");

    expect(onChange).toHaveBeenCalledWith(2008);
  });

  it("reports clearing as null rather than an empty string", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<YearSelect years={years} value={2008} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "");

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("is operable by keyboard alone", async () => {
    const user = userEvent.setup();
    render(<YearSelect years={years} value={null} onChange={jest.fn()} />);

    await user.tab();

    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("renders with no years without breaking the clear option", () => {
    render(<YearSelect years={[]} value={null} onChange={jest.fn()} />);

    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <YearSelect years={years} value={null} onChange={jest.fn()} />
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
