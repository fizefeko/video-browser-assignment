import { z } from "zod";

/**
 * A display field that upstream sometimes serialises as a number — video 866934
 * ships `"title": 100`.
 *
 * Accepting `string | number` explicitly is deliberate. `z.coerce.string()` would
 * also turn `null` into `"null"`, `true` into `"true"` and `{}` into
 * `"[object Object]"`, so a genuinely broken row would render as a card with
 * garbage in it instead of being flagged. This union states exactly which upstream
 * quirk is tolerated and rejects everything else.
 */
export const displayText = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .pipe(z.string().min(1));

export const genreSchema = z.object({
  id: z.number().int(),
  name: displayText,
});

export const rawVideoSchema = z.object({
  id: z.number().int(),
  artist: displayText,
  title: displayText,
  release_year: z.number().int(),
  genre_id: z.number().int(),
  image_url: z.url(),
});

/**
 * Only the envelope is strict: both arrays must exist, or the payload is not the
 * dataset at all and the request should fail. Individual rows are validated one at
 * a time by `parseDataset`, so a single malformed record cannot take down the
 * other 499.
 */
export const datasetEnvelopeSchema = z.object({
  genres: z.array(z.unknown()),
  videos: z.array(z.unknown()),
});

export type RawVideo = z.infer<typeof rawVideoSchema>;
