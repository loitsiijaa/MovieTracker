import { afterEach, describe, expect, it, vi } from "vitest";
import { getWatchlist, removeWatchStatus } from "../api/watchlist";

const apiUrl = "https://example.test";
const accessToken = "test-token";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("API мого списку", () => {
  it("надсилає номер сторінки, статус і токен", async () => {
    const data = { page: 2, pageSize: 20, totalCount: 0, items: [] };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(data));

    vi.stubEnv("VITE_API_URL", apiUrl);
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getWatchlist(accessToken, 2, undefined, "Planned"),
    ).resolves.toEqual(data);

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/api/users/me/movies?page=2&status=Planned`,
      expect.objectContaining({
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
  });

  it("просить увійти знову після відповіді 401", async () => {
    vi.stubEnv("VITE_API_URL", apiUrl);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(getWatchlist(accessToken, 1)).rejects.toThrow(
      "Увійди знову, щоб відкрити свій список.",
    );
  });

  it("вважає видалення успішним, якщо фільму вже немає у списку", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

    vi.stubEnv("VITE_API_URL", apiUrl);
    vi.stubGlobal("fetch", fetchMock);

    await expect(removeWatchStatus(accessToken, 42)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/api/movies/42/status`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
  });
});