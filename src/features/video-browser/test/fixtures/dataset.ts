/**
 * Hand-built payloads mirroring the real dataset's quirks, so tests do not depend
 * on the network. Every oddity here was verified against the live endpoint:
 * a numeric title, a `genre_id` with no matching genre, and a genre with no videos.
 */
export const genresFixture = [
  { id: 5, name: "Pop" },
  { id: 8, name: "Rock" },
  // Present in `genres` but referenced by no video — mirrors R&B/Soul, Other and
  // Children's in the real data.
  { id: 25, name: "R&B/Soul" },
];

export const videosFixture = [
  {
    id: 501437,
    artist: "Pants Velour",
    title: "All In",
    release_year: 2014,
    genre_id: 5,
    image_url: "https://example.test/images/501437.jpg",
  },
  {
    id: 210001,
    artist: "Beyoncé",
    title: "Single Ladies (Put a Ring on It)",
    release_year: 2008,
    genre_id: 8,
    image_url: "https://example.test/images/210001.jpg",
  },
  {
    // The landmine: upstream serialises this title as a number.
    id: 866934,
    artist: "Kid3rd",
    title: 100,
    release_year: 2017,
    genre_id: 165,
    image_url: "https://example.test/images/866934.jpg",
  },
  {
    // genre_id 1 has no entry in `genres` — 111 real rows look like this.
    id: 330002,
    artist: "Fielfraz",
    title: "Personal Jesus",
    release_year: 1991,
    genre_id: 1,
    image_url: "https://example.test/images/330002.jpg",
  },
];

export const datasetFixture = {
  genres: genresFixture,
  videos: videosFixture,
};
