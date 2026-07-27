import {
  act,
  renderHook,
  waitFor,
  type RenderHookResult,
} from "@testing-library/react";
import { SWRConfig } from "swr";

import {
  useVideos,
  type UseVideosResult,
} from "~/features/video-browser/hooks/use-videos";

const mockFetch = jest.fn();

global.fetch = mockFetch as unknown as typeof fetch;

const payload = {
  videos: [{ id: 1, title: "All In" }],
  genres: [{ id: 5, name: "Pop" }],
};

function respondWith(body: unknown, ok = true): void {
  mockFetch.mockResolvedValue({ ok, json: () => Promise.resolve(body) });
}

/** A fresh SWR cache per test, otherwise results leak between them. */
function Wrapper({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

function renderUseVideos(): RenderHookResult<UseVideosResult, undefined> {
  return renderHook(() => useVideos(), { wrapper: Wrapper });
}

describe("useVideos", () => {
  it("reports loading before anything arrives", () => {
    respondWith(payload);

    const { result } = renderUseVideos();

    expect(result.current.isLoading).toBe(true);
    expect(result.current.videos).toEqual([]);
    expect(result.current.genres).toEqual([]);
  });

  it("exposes the payload once loaded", async () => {
    respondWith(payload);

    const { result } = renderUseVideos();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.videos).toEqual(payload.videos);
    expect(result.current.genres).toEqual(payload.genres);
    expect(result.current.error).toBeUndefined();
  });

  it("requests our own route rather than the upstream file", async () => {
    respondWith(payload);

    const { result } = renderUseVideos();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockFetch).toHaveBeenCalledWith("/api/videos");
  });

  it("surfaces the server's message on failure", async () => {
    respondWith({ message: "Could not load videos. Please try again." }, false);

    const { result } = renderUseVideos();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.error?.message).toBe(
      "Could not load videos. Please try again."
    );
  });

  it("falls back to a friendly message when the error body is unusable", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("not json")),
    });

    const { result } = renderUseVideos();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.error?.message).toBe(
      "Could not load videos. Please try again."
    );
  });

  it("keeps the lists empty on failure rather than returning undefined", async () => {
    respondWith({ message: "boom" }, false);

    const { result } = renderUseVideos();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.videos).toEqual([]);
    expect(result.current.genres).toEqual([]);
  });

  it("refetches when retried, and can recover", async () => {
    respondWith({ message: "boom" }, false);

    const { result } = renderUseVideos();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    respondWith(payload);
    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.videos).toEqual(payload.videos);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
