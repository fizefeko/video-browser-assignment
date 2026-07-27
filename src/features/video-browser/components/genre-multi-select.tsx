import { Popover } from "radix-ui";

import type { Genre } from "~/features/video-browser/types";

export const GENRE_PLACEHOLDER = "Search by Genre...";

export const GENRE_PANEL_LABEL = "Genre filter";

export function formatSelectionLabel(count: number): string {
  if (count === 0) {
    return GENRE_PLACEHOLDER;
  }

  return count === 1 ? "1 genre selected" : `${count} genres selected`;
}

interface GenreMultiSelectProps {
  genres: Array<Genre>;
  selectedIds: Array<number>;
  onToggle: (genreId: number) => void;
  onClear: () => void;
}

/**
 * Multi-select genre filter.
 *
 * HTML has no usable multi-select — `<select multiple>` needs ctrl-click and
 * cannot look like the mockup — so this is the one control worth a dependency.
 * Radix's Popover supplies the focus trap, Escape handling, click-outside and
 * focus return to the trigger; the options themselves are plain checkboxes,
 * which are already perfectly accessible and need no library.
 *
 * Selecting a genre twice is impossible by construction: the state is a set of
 * ids and each option is a checkbox that toggles, so no validation is required
 * for the brief's "same genre cannot be selected more than once".
 *
 * The selection count is rendered as visible text rather than hidden in an
 * aria-label. Sighted users get the same information, and it avoids the accessible
 * name diverging from the visible label, which WCAG 2.5.3 forbids.
 */
export function GenreMultiSelect({
  genres,
  selectedIds,
  onToggle,
  onClear,
}: GenreMultiSelectProps): React.ReactNode {
  const selected = new Set(selectedIds);

  return (
    <Popover.Root>
      <Popover.Trigger className="border-control bg-field text-ink focus-visible:outline-ink flex h-9 w-full min-w-0 items-center justify-between gap-2 border pr-3 pl-3 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-44">
        <span className={selected.size === 0 ? "text-ink-muted" : undefined}>
          {formatSelectionLabel(selected.size)}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="h-3 w-3 shrink-0"
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
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={2}
          aria-label={GENRE_PANEL_LABEL}
          className="border-control bg-surface data-[state=open]:animate-panel-enter z-10 flex max-h-72 w-56 flex-col border shadow-md motion-reduce:animate-none"
        >
          {/*
            Only the option list scrolls. With the whole panel scrolling, the
            clear action sat below all 18 genres and could not be reached without
            scrolling to the very bottom.
          */}
          <fieldset className="min-h-0 flex-1 overflow-y-auto">
            <legend className="sr-only">{GENRE_PANEL_LABEL}</legend>
            {genres.map((genre) => (
              <label
                key={genre.id}
                className="hover:bg-field flex min-h-9 cursor-pointer items-center gap-2 px-3 py-2 text-xs"
              >
                <input
                  type="checkbox"
                  checked={selected.has(genre.id)}
                  onChange={() => onToggle(genre.id)}
                  className="accent-ink size-4 shrink-0"
                />
                <span className="text-ink">{genre.name}</span>
              </label>
            ))}
          </fieldset>

          <div className="border-hairline shrink-0 border-t p-2">
            <button
              type="button"
              onClick={onClear}
              disabled={selected.size === 0}
              className="text-ink hover:bg-field focus-visible:outline-ink w-full px-2 py-1.5 text-left text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:opacity-50"
            >
              Clear selection
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
