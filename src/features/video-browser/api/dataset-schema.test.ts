import {
  datasetEnvelopeSchema,
  displayText,
  rawVideoSchema,
} from "~/features/video-browser/api/dataset-schema";

describe("displayText", () => {
  it("accepts a plain string", () => {
    expect(displayText.parse("All In")).toBe("All In");
  });

  it("accepts a number, which is how video 866934 ships its title", () => {
    expect(displayText.parse(100)).toBe("100");
  });

  it("trims surrounding whitespace", () => {
    expect(displayText.parse("  Olly Murs  ")).toBe("Olly Murs");
  });

  // The whole point of the explicit union: z.coerce.string() would accept every
  // one of these and produce "null", "undefined", "true" or "[object Object]".
  it.each([[null], [undefined], [true], [{}], [[]]])(
    "rejects %p instead of stringifying it",
    (input) => {
      expect(displayText.safeParse(input).success).toBe(false);
    }
  );

  it("rejects a string that is only whitespace", () => {
    expect(displayText.safeParse("   ").success).toBe(false);
  });
});

describe("rawVideoSchema", () => {
  const valid = {
    id: 501437,
    artist: "Pants Velour",
    title: "All In",
    release_year: 2014,
    genre_id: 5,
    image_url: "https://example.test/a.jpg",
  };

  it("accepts a well-formed row", () => {
    expect(rawVideoSchema.safeParse(valid).success).toBe(true);
  });

  it("normalises a numeric title to a string", () => {
    const result = rawVideoSchema.parse({ ...valid, title: 100 });

    expect(result.title).toBe("100");
  });

  it("rejects a row without an id, since it cannot be keyed or deduplicated", () => {
    expect(rawVideoSchema.safeParse({ ...valid, id: undefined }).success).toBe(
      false
    );
  });

  it("rejects a non-numeric release year", () => {
    expect(
      rawVideoSchema.safeParse({ ...valid, release_year: "2014" }).success
    ).toBe(false);
  });

  it("rejects an image_url that is not a URL", () => {
    expect(
      rawVideoSchema.safeParse({ ...valid, image_url: "not-a-url" }).success
    ).toBe(false);
  });
});

describe("datasetEnvelopeSchema", () => {
  it("accepts the two arrays without inspecting their rows", () => {
    expect(
      datasetEnvelopeSchema.safeParse({ genres: [1, "nonsense"], videos: [{}] })
        .success
    ).toBe(true);
  });

  it.each([
    ["a missing videos array", { genres: [] }],
    ["a missing genres array", { videos: [] }],
    ["videos as an object", { genres: [], videos: {} }],
    ["null", null],
  ])("rejects %s", (_label, payload) => {
    expect(datasetEnvelopeSchema.safeParse(payload).success).toBe(false);
  });
});
