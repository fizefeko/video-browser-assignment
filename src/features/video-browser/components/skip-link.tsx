interface SkipLinkProps {
  targetId: string;
  children: string;
}

/**
 * Hidden until focused. Worth having here rather than being boilerplate: the
 * genre panel puts a run of tab stops between the top of the page and the
 * results, so keyboard users would otherwise tab through the whole filter row
 * before reaching the grid.
 */
export function SkipLink({
  targetId,
  children,
}: SkipLinkProps): React.ReactNode {
  return (
    <a
      href={`#${targetId}`}
      className="bg-surface text-ink outline-ink sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:px-3 focus:py-2 focus:text-xs focus:outline-2"
    >
      {children}
    </a>
  );
}
