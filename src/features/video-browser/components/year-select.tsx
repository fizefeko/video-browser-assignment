const SELECT_ID = "year-filter";

export const YEAR_LABEL = "Filter by release year";

/** Doubles as the brief's required "clear / show all years" option. */
export const ALL_YEARS_LABEL = "All years";

interface YearSelectProps {
  years: Array<number>;
  value: number | null;
  onChange: (year: number | null) => void;
}

/**
 * Single-select year filter, deliberately a native `<select>`.
 *
 * With 41 options, the native control beats any scripted listbox: roving focus,
 * Home/End, type-ahead, Escape, scroll-into-view and a native picker on iOS all
 * come for free and behave the way the user's platform taught them. It also
 * accepts an empty value directly, so "all years" needs no sentinel.
 */
export function YearSelect({
  years,
  value,
  onChange,
}: YearSelectProps): React.ReactNode {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={SELECT_ID}>
        {YEAR_LABEL}
      </label>
      <select
        id={SELECT_ID}
        value={value === null ? "" : `${value}`}
        onChange={(event) =>
          onChange(
            event.target.value === "" ? null : Number(event.target.value)
          )
        }
        className="border-control bg-field text-ink focus-visible:outline-ink h-9 w-full min-w-0 appearance-none border pr-8 pl-3 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-40"
      >
        <option value="">{ALL_YEARS_LABEL}</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="text-ink-muted pointer-events-none absolute top-1/2 right-3 h-3 w-3 -translate-y-1/2"
      >
        <path
          d="M2 4.5 6 8.5 10 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
