export type WatchStatus = "Watched" | "Planned" | "Dropped";

export type WatchlistItem = {
  movieId: number;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  status: WatchStatus;
  updatedAt: string;
};

type WatchlistResponse = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: WatchlistItem[];
};

export async function getWatchlist(
  accessToken: string,
  page: number,
  signal?: AbortSignal,
  status?: WatchStatus,
): Promise<WatchlistResponse> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const params = new URLSearchParams({ page: String(page) });

  if (status) {
    params.set("status", status);
  }

  const response = await fetch(`${apiUrl}/api/users/me/movies?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб відкрити свій список.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити список (${response.status}).`);
  }

  return response.json();
}

export async function getWatchStatus(
  accessToken: string,
  movieId: number,
  signal?: AbortSignal,
): Promise<WatchStatus | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/api/movies/${movieId}/status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  if (response.status === 404) return null;

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб переглянути статус фільму.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити статус (${response.status}).`);
  }

  const data: { status: WatchStatus } = await response.json();
  return data.status;
}

export async function saveWatchStatus(
  accessToken: string,
  movieId: number,
  status: WatchStatus,
): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/api/movies/${movieId}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб зберегти статус фільму.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося зберегти статус (${response.status}).`);
  }
}

export async function removeWatchStatus(
  accessToken: string,
  movieId: number,
): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/api/movies/${movieId}/status`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 404) return;

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб видалити фільм зі списку.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося видалити фільм (${response.status}).`);
  }
}