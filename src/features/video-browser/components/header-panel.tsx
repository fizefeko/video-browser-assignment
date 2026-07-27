import { GenreMultiSelect } from "~/features/video-browser/components/genre-multi-select";
import { VideoSearchInput } from "~/features/video-browser/components/video-search-input";
import { YearSelect } from "~/features/video-browser/components/year-select";
import type { FilterOptions } from "~/features/video-browser/types";

export const APP_TITLE = "Video Browser";

interface HeaderPanelProps {
  query: string;
  year: number | null;
  selectedGenreIds: Array<number>;
  options: FilterOptions;
  onQueryChange: (value: string) => void;
  onYearChange: (year: number | null) => void;
  onGenreToggle: (genreId: number) => void;
  onGenresClear: () => void;
}

/**
 * Application title above the three filters, matching the mockup. Holds no state
 * of its own — every control is driven by props so the filter logic lives in one
 * place and this stays trivially testable.
 */
export function HeaderPanel({
  query,
  year,
  selectedGenreIds,
  options,
  onQueryChange,
  onYearChange,
  onGenreToggle,
  onGenresClear,
}: HeaderPanelProps): React.ReactNode {
  return (
    <header
      // Sticks while the page scrolls. The background must be opaque or cards
      // would show through as they pass underneath.
      className="border-hairline bg-surface sticky top-0 z-20 border-b px-4 pt-5 pb-4"
    >
      <h1 className="text-ink text-center text-xl font-bold tracking-tight">
        {APP_TITLE}
      </h1>

      <div className="mt-4 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
        <VideoSearchInput value={query} onChange={onQueryChange} />
        <YearSelect
          years={options.years}
          value={year}
          onChange={onYearChange}
        />
        <GenreMultiSelect
          genres={options.genres}
          selectedIds={selectedGenreIds}
          onToggle={onGenreToggle}
          onClear={onGenresClear}
        />
      </div>
    </header>
  );
}
