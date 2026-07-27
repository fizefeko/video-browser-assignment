/** Copy is verbatim from the brief, including the past tense. */
export const EMPTY_STATE_MESSAGE = "No videos were found";

export function EmptyState(): React.ReactNode {
  return (
    <p className="text-ink-muted py-16 text-center text-sm">
      {EMPTY_STATE_MESSAGE}
    </p>
  );
}
