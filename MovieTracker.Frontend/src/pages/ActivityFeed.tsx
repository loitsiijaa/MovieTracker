import { useEffect, useState } from "react";
import type { WatchStatus } from "../api/watchlist";

type FeedItem = {
  type: "review" | "status";
  userId: string;
  displayName: string;
  movieId: number;
  movieTitle: string;
  rating: number | null;
  reviewText: string | null;
  status: WatchStatus | null;
  createdAt: string;
};

type FeedPage = {
  totalPages: number;
  items: FeedItem[];
};

type ActivityFeedProps = {
  accessToken: string;
  onBack: () => void;
  onOpenMovie: (movieId: number) => void;
  onOpenProfile: (userId: string) => void;
};

const statusLabels: Record<WatchStatus, string> = {
  Planned: "Заплановано",
  Watched: "Переглянуто",
  Dropped: "Закинуто",
};

export default function ActivityFeed({
  accessToken,
  onBack,
  onOpenMovie,
  onOpenProfile,
}: ActivityFeedProps) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<FeedPage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeed() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const params = new URLSearchParams({ page: String(page) });
        const response = await fetch(`${apiUrl}/api/users/me/feed?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error("Увійди знову, щоб переглянути стрічку.");
        }

        if (!response.ok) {
          throw new Error(`Не вдалося завантажити стрічку (${response.status}).`);
        }

        const data: FeedPage = await response.json();
        if (!controller.signal.aborted) setResult(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Не вдалося завантажити стрічку.",
        );
      }
    }

    void loadFeed();
    return () => controller.abort();
  }, [accessToken, page]);

  function goToPage(nextPage: number) {
    setResult(null);
    setError("");
    setPage(nextPage);
  }

  const totalPages = Math.max(1, result?.totalPages ?? 1);

  return (
    <main>
      <button type="button" onClick={onBack}>← До каталогу</button>
      <h1>Стрічка активності</h1>

      {error && <p role="alert">{error}</p>}
      {!error && !result && <p role="status">Завантажуємо стрічку…</p>}
      {result?.items.length === 0 && (
        <p>На цій сторінці поки немає активності від твоїх підписок.</p>
      )}

      {result && result.items.length > 0 && (
        <ul className="movie-reviews__list">
          {result.items.map((item) => (
            <li
              key={`${item.type}-${item.userId}-${item.movieId}-${item.createdAt}`}
              className="movie-reviews__card"
            >
              <h2>
                <button type="button" onClick={() => onOpenMovie(item.movieId)}>
                  {item.movieTitle}
                </button>
              </h2>

              <p>
                <button type="button" onClick={() => onOpenProfile(item.userId)}>
                  {item.displayName}
                </button>
              </p>

              {item.type === "review" && item.rating !== null && (
                <p className="movie-reviews__rating">Оцінка {item.rating} / 10</p>
              )}
              {item.type === "review" && item.reviewText && <p>{item.reviewText}</p>}
              {item.type === "status" && item.status && (
                <p>Статус фільму: {statusLabels[item.status]}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {(totalPages > 1 || page > 1) && (
        <nav aria-label="Сторінки стрічки">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Назад
          </button>
          <span>Сторінка {page}</span>
          <button
            type="button"
            disabled={!result || page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Далі
          </button>
        </nav>
      )}
    </main>
  );
}