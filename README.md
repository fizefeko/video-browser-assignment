# Video Browser

A single-page app for browsing 500 music videos, filterable by free text, release year
and genre. Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind 4.

---

## Getting started

Requires Node 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

For a production build:

```bash
pnpm build
pnpm start          # http://localhost:3000
```

> The app fetches its data from GitHub at runtime. On networks that block
> `raw.githubusercontent.com` — some corporate proxies do — the app will show its error
> state with a retry button rather than failing silently.

### Scripts

| Command              | What it does                              |
| -------------------- | ----------------------------------------- |
| `pnpm dev`           | Dev server with hot reload                |
| `pnpm build`         | Production build                          |
| `pnpm start`         | Serve the production build                |
| `pnpm test`          | Unit tests (311 across 21 suites)         |
| `pnpm test:watch`    | Tests in watch mode                       |
| `pnpm test:coverage` | Tests with coverage, enforcing thresholds |
| `pnpm lint`          | ESLint                                    |
| `pnpm format`        | Prettier, writing changes                 |
| `pnpm check-types`   | TypeScript, no emit                       |

---

## What it does

- **Free-text filter** over artist **or** title, applied as you type, no submit button
- **Year filter**, single-select, with an "All years" option that clears it
- **Genre filter**, multi-select with checkboxes and a clear action
- **All three combine with AND**; several genres are OR-ed against each other
- **Dropdown options narrow** to what the current text search can actually return
- **Responsive grid**: one column on mobile, two at `sm`, three from `lg`
- **Twelve videos at a time**, extended on scroll or via a "Load more" button
- **Shareable URLs** — filters live in the query string and survive a reload
- Loading skeletons, an error state with retry, and the empty state `No videos were found`

---

## Architecture

One self-contained feature module. Everything the browser needs lives under
`src/features/video-browser`, and `src/app` holds only the route entry points.

```
src/
├── app/
│   ├── api/videos/route.ts        Proxies + validates the upstream dataset
│   ├── layout.tsx                 Document shell, fonts, metadata
│   ├── page.tsx                   Renders <VideoBrowser />
│   └── globals.css                Design tokens, keyframes, reduced-motion
│
└── features/video-browser/
    ├── api/
    │   ├── dataset-schema.ts      Zod schemas for the upstream payload
    │   ├── parse-dataset.ts       Validate → normalise → join genres (pure)
    │   └── fetch-dataset.ts       server-only upstream fetch
    ├── components/
    │   ├── video-browser.tsx      Orchestrator; owns no filtering logic itself
    │   ├── header-panel.tsx       Title + the three controls
    │   ├── video-search-input.tsx
    │   ├── year-select.tsx        Radix Select
    │   ├── genre-multi-select.tsx Radix Popover + native checkboxes
    │   ├── video-card.tsx         Hand-built card
    │   ├── video-card-list.tsx    Hand-built grid
    │   ├── load-more.tsx          Observer + button
    │   ├── video-card-skeleton-grid.tsx
    │   ├── empty-state.tsx · error-state.tsx · skip-link.tsx
    ├── hooks/
    │   ├── use-videos.ts          SWR against our route handler
    │   ├── use-video-filters.ts   Filter reducer + derived results and options
    │   ├── use-paginated-list.ts  Reveals a list one page at a time
    │   └── use-filter-url.ts      Restores from and mirrors to the URL
    ├── utils/
    │   ├── filter-videos.ts       The filter itself (pure)
    │   ├── derive-filter-options.ts
    │   ├── normalize-search.ts    Accent folding
    │   └── filter-url.ts          Query-string serialise/parse (pure)
    └── types/index.ts
```

**How data flows.** `route.ts` fetches the upstream JSON, validates it, resolves genre
names and camel-cases the result. `useVideos` consumes that with SWR, giving the UI real
loading, error and retry states. `useVideoFilters` holds filter state in a reducer and
derives both the filtered results and the dropdown options. `usePaginatedList` reveals
those results a page at a time. `VideoBrowser` wires these together and renders; it
contains no filtering logic of its own.

**The logic is in pure functions.** `filterVideos`, `deriveFilterOptions`,
`normalizeForSearch`, `parseDataset` and the URL serialisers are all plain functions with
no React in them, so the behaviour that matters most is tested without rendering anything.

---

## Decisions worth explaining

### The dataset has three traps, and each one changed the code

These were found by analysing the payload before writing anything.

**1. One `title` is a number, not a string.** Video `866934` ships `"title": 100`. A
straightforward `video.title.toLowerCase()` in the filter throws on the first keystroke
and blanks the whole page.

It is treated as a wire-format quirk rather than invalid data — `100` is a plausible
title — so display fields accept `string | number` and normalise to `string` at the API
boundary. That uses an explicit union rather than `z.coerce.string()`, which would also
turn `null` into `"null"` and `{}` into `"[object Object]"` and render a card with garbage
in it instead of flagging a broken row.

**2. A third of the catalogue has no resolvable genre.** 166 of 500 videos reference a
`genre_id` absent from the `genres` table. Their `genreName` is `null`: they appear
normally when no genre filter is active, and are excluded once one is. Dropping them would
have hidden a third of the data.

**3. Three genres have no videos** (`R&B/Soul`, `Other/Non-Music`, `Children's`). Options
are derived from the genres actually present in the videos, so no option can be offered
whose only possible outcome is "No videos were found".

Validation is per-row, so one malformed record costs one video rather than the whole
response, and rejected rows are logged rather than silently dropped.

### A route handler in front of the dataset

The browser talks to `/api/videos`, which proxies upstream. That keeps validation, the
genre join and the search-index precompute on the server, done once instead of per client,
and it gives the UI genuine loading and error states — which a purely server-rendered list
would not have. It still fetches from the given URL at runtime; nothing is committed.

### Filter semantics

AND across the three filters; OR within the genre selection, since picking Rock and Pop is
a request for both. Text matches artist **or** title, each compared separately —
a single concatenated index would also match a query straddling the two fields,
so `"velour all"` would wrongly hit `Pants Velour` / `All In`.

Search is accent-folded, because 51 rows contain diacritics and typing `beyonce` should
find `Beyoncé`.

### `useDeferredValue`, not a debounce

Filtering all 500 rows costs **8.8 µs** — about 1,900× under a 60fps frame budget. A
debounce would only add latency and work against the brief's "filters as the user types".
Deferring keeps the input responsive while the grid catches up.

### Pagination instead of virtualisation

Rendering all 500 cards put 3,573 elements in the DOM, the one metric Lighthouse flagged.
Revealing twelve at a time brings that to **162** and the audit passes. Virtualisation was
considered and rejected: it breaks in-page `Ctrl+F`, complicates the results region's
focus handling, and every user-facing metric was already at ceiling.

### Filters in the URL

Written with `history.replaceState` rather than `router.replace`, which would re-run the
route on every keystroke, and would stack a history entry per character typed. Read after
mount rather than through `useSearchParams`, which on a statically prerendered route
requires a Suspense boundary that would cost the server-rendered shell behind the fast
first paint.

### Radix for both dropdowns, everything else by hand

The brief allows third-party dropdown components and requires the card and card list be
written by hand — they are. `Popover` and `Select` from Radix supply focus trapping,
`Escape`, click-outside and focus return; the genre options themselves are plain
checkboxes, which need no library. Selecting the same genre twice is impossible by
construction rather than by validation: state is a set of ids and each option toggles.

---

## Accessibility

Built in per component rather than retrofitted.

- Every control has a real label. The mockup shows placeholders only, so labels are
  visually hidden — a placeholder disappears on input and is announced inconsistently.
- The grid is a real `<ul>`/`<li>` with an explicit `role="list"`, because Tailwind's reset
  removes list markers and Safari/VoiceOver drop list semantics along with them.
- **Thumbnails use `alt=""` deliberately.** The caption beneath already states title,
  artist and year, so describing the image would make screen readers read the same three
  facts twice. This is a decision, not an omission.
- A polite live region reports the result count, bound to the deferred query so it settles
  when typing pauses instead of firing on every keystroke. The count is also on screen.
- The genre trigger states its selection count as visible text, so the information is not
  screen-reader-only and the accessible name matches the visible label.
- Infinite scroll is paired with a real "Load more" button — scroll-triggered loading alone
  strands keyboard and screen-reader users.
- A skip link jumps past the filter row to the results.
- All motion is disabled under `prefers-reduced-motion`.

**Verified by:** 8 `jsx-a11y` lint rules, `jest-axe` asserting zero violations across
populated, empty, loading and error states plus both open dropdowns, a test that parses
`globals.css` and holds every colour pair to WCAG contrast minimums, and Lighthouse.
Not verified: a real screen-reader pass.

---

## Measurements

Lighthouse 12, desktop preset, production build:

| Metric                   | Result  |
| ------------------------ | ------- |
| Performance              | **100** |
| Accessibility            | **100** |
| Best practices           | **100** |
| Largest Contentful Paint | 0.5 s   |
| Cumulative Layout Shift  | 0.004   |
| Total Blocking Time      | 0 ms    |
| DOM elements             | 162     |

The largest single win came from correcting the `sizes` hint on thumbnails: it claimed
`33vw`, but the grid sits in a max-width container, so past that breakpoint a card is a
fixed 320px. Next had been fetching ~422px sources for a 320px slot, 500 times over.
Describing the real width took LCP from 0.9s to 0.5s.

---

## Testing

```bash
pnpm test               # 311 tests, 21 suites
pnpm test:coverage      # enforces 80% statements / 75% branches
```

Currently 98% statements and **100% branches**.

Tests favour behaviour over implementation: queried by role and accessible name, driven
with `user-event`, and asserting what a user would observe. The three data traps above all
have named regression tests.

**What tests cannot cover here:** jsdom computes no layout, so it cannot see an element
overflowing its container. One such bug — the genre list escaping its panel and painting
over the cards — passed 224 green tests while being visibly broken, and was found in a real
browser. Layout is verified by screenshot, not by the suite.

---

## Assumptions and notes

1. **The brief's own example returns no results.** Searching `John Mayer` with year `2013`
   and genre `Rock` yields nothing, because that video's genre is **Pop**. The empty state
   is correct AND behaviour, not a bug. `John Mayer` + `2013` alone returns one video.
2. **Options are derived from the videos**, not from the dataset's `genres` table, so an
   option can never return nothing.
3. **A selected filter stays listed even when the text search excludes it.** Otherwise the
   year control would hold a value it no longer offers and display the wrong one. The
   result set legitimately becomes empty, and the empty state explains it.
4. **The year control reads "All years"** rather than the mockup's "Search by Year…"
   placeholder. It satisfies the required clear option and states the actual filter state,
   where a placeholder-styled entry leaves users hunting for a reset.
5. **Filter borders are darker than the mockup's hairline.** Measured at 1.26:1 against
   white, the original failed the 3:1 WCAG requires for identifying a UI component. The
   purely decorative rule under the header keeps the lighter value.
6. **Design is light-only.** The scaffold's dark-mode block was removed rather than left to
   invert the white panel and pale-yellow captions.
7. **Two columns at tablet** sits inside the brief's "minimum one, maximum three".

### Known limitations

- On very tall viewports a second page loads immediately, because the observer's sentinel
  falls inside its preload margin. Intended — it fills the viewport rather than leaving a
  button above the fold.
- Because data is fetched client-side, the LCP image cannot be discovered in the initial
  HTML. Server-rendering the first page of results would improve it further.
- Back and forward do not step through filter states. Filters are written with `replace`,
  deliberately, so typing does not fill the history stack.
