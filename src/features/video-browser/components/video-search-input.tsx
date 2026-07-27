const INPUT_ID = "video-search";

export const SEARCH_LABEL = "Search videos by artist or title";

interface VideoSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Free-text filter over artist and title. Filters as the user types — the brief
 * asks for no submit button and no autocomplete.
 *
 * The label is visually hidden rather than omitted: the mockup shows only a
 * placeholder, and a placeholder is not a label. It disappears the moment the
 * user types, is announced inconsistently, and cannot be clicked to focus.
 */
export function VideoSearchInput({
  value,
  onChange,
}: VideoSearchInputProps): React.ReactNode {
  return (
    <div>
      <label className="sr-only" htmlFor={INPUT_ID}>
        {SEARCH_LABEL}
      </label>
      <input
        id={INPUT_ID}
        type="search"
        value={value}
        placeholder="Search Video..."
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="border-control bg-field text-ink placeholder:text-ink-muted focus-visible:outline-ink h-9 w-full min-w-0 border px-3 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-40"
      />
    </div>
  );
}
