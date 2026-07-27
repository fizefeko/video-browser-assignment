import { Select } from "radix-ui";

export const YEAR_LABEL = "Filter by release year";

/** Doubles as the brief's required "clear / show all years" option. */
export const ALL_YEARS_LABEL = "All years";

/**
 * Radix forbids an empty-string item value, reserving it for the placeholder, so
 * "show everything" needs a sentinel of its own. It never leaves this component —
 * callers only ever see a year or null.
 */
const ALL_YEARS_VALUE = "all";

interface YearSelectProps {
  years: Array<number>;
  value: number | null;
  onChange: (year: number | null) => void;
}

function Caret(): React.ReactNode {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className="text-ink-muted h-3 w-3 shrink-0"
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
  );
}

/**
 * Single-select year filter.
 *
 * Uses Radix rather than a native `<select>` so it renders identically to the genre
 * panel beside it — a native menu is drawn by the operating system and looked
 * conspicuously unlike the rest of the design. Radix supplies the keyboard
 * behaviour a native select would have given for free: arrow keys, Home/End,
 * type-ahead, Escape, and focus returning to the trigger.
 */
export function YearSelect({
  years,
  value,
  onChange,
}: YearSelectProps): React.ReactNode {
  return (
    <Select.Root
      value={value === null ? ALL_YEARS_VALUE : `${value}`}
      onValueChange={(next) =>
        onChange(next === ALL_YEARS_VALUE ? null : Number(next))
      }
    >
      <Select.Trigger
        aria-label={YEAR_LABEL}
        className="border-control bg-field text-ink focus-visible:outline-ink flex h-9 w-full min-w-0 items-center justify-between gap-2 border px-3 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-40"
      >
        <Select.Value />
        <Select.Icon asChild>
          <Caret />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          // popper keeps it anchored below the trigger like the genre panel,
          // rather than overlaying it. z-30 clears the sticky header.
          position="popper"
          sideOffset={2}
          className="border-control bg-surface data-[state=open]:animate-panel-enter z-30 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden border shadow-md motion-reduce:animate-none"
        >
          <Select.ScrollUpButton className="text-ink-muted flex h-5 items-center justify-center text-xs">
            ▲
          </Select.ScrollUpButton>

          <Select.Viewport>
            <Select.Item
              value={ALL_YEARS_VALUE}
              className="data-highlighted:bg-field flex min-h-9 cursor-pointer items-center px-3 text-xs outline-none data-[state=checked]:font-semibold"
            >
              <Select.ItemText>{ALL_YEARS_LABEL}</Select.ItemText>
            </Select.Item>

            {years.map((year) => (
              <Select.Item
                key={year}
                value={`${year}`}
                className="data-highlighted:bg-field flex min-h-9 cursor-pointer items-center px-3 text-xs outline-none data-[state=checked]:font-semibold"
              >
                <Select.ItemText>{year}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="text-ink-muted flex h-5 items-center justify-center text-xs">
            ▼
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
