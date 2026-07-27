interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/**
 * `role="alert"` so the failure interrupts rather than waiting to be discovered —
 * the user has no other signal that the catalogue never arrived.
 */
export function ErrorState({
  message,
  onRetry,
}: ErrorStateProps): React.ReactNode {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <p className="text-ink text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="border-hairline text-ink hover:bg-field focus-visible:outline-ink rounded border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
