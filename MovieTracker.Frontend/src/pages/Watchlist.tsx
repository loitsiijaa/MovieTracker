import { useEffect, useState } from "react";
import {
  getWatchlist,
  removeWatchStatus,
  type WatchStatus,
} from "../api/watchlist";

type WatchlistProps = {
  accessToken: string;
  onBack: () => void;
};

const statusLabels: Record<WatchStatus, string> = {
  Planned: "Заплановано",
  Watched: "Переглянуто",
  Dropped: "Закинуто",
};

const statuses: WatchStatus[] = ["Planned", "Watched", "Dropped"];

export default function Watchlist({ accessToken, onBack }: WatchlistProps) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<WatchStatus | undefined>();
  const [result, setResult] =
    useState<Awaited<ReturnType<typeof getWatchlist>> | null>(null);
  const [loadError, setLoadError] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadWatchlist() {
      try {
        const data = await getWatchlist(
          accessToken,
          page,
          controller.signal,
          filter,
        );
        if (!controller.signal.aborted) setResult(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error ? error.message : "Не вдалося завантажити список.",
        );
      }
    }

    void loadWatchlist();
    return () => controller.abort();
  }, [accessToken, page, filter, refreshCount]);

  function goToPage(nextPage: number) {
    setResult(null);
    setLoadError("");
    setRemoveError("");
    setMessage("");
    setPage(nextPage);
  }

  function changeFilter(value: string) {
    const nextFilter = statuses.find((status) => status === value);
    if (nextFilter === filter) return;

    setFilter(nextFilter);
    goToPage(1);
  }

  async function handleRemove(movieId: number, title: string) {
    if (!result || removingId !== null) return;

    setRemovingId(movieId);
    setRemoveError("");
    setMessage("");

    try {
      await removeWatchStatus(accessToken, movieId);

      const remainingCount = Math.max(0, result.totalCount - 1);
      const lastPage = Math.max(1, Math.ceil(remainingCount / result.pageSize));

      setResult(null);
      setLoadError("");
      setPage(Math.min(page, lastPage));
      setRefreshCount((count) => count + 1);
      setMessage(`«${title}» видалено зі списку.`);
    } catch (error) {
      setRemoveError(
        error instanceof Error ? error.message : "Не вдалося видалити фільм.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  const totalPages = result
    ? Math.max(1, Math.ceil(result.totalCount / result.pageSize))
    : 1;

  return (
    <main>
      <button type="button" onClick={onBack}>← До каталогу</button>
      <h1>Мій список</h1>

      <p>
        <label htmlFor="watchlist-filter">Статус</label>{" "}
        <select
          id="watchlist-filter"
          value={filter ?? ""}
          disabled={removingId !== null}
          onChange={(event) => changeFilter(event.target.value)}
        >
          <option value="">Усі</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </p>

      {message && <p role="status">{message}</p>}
      {loadError && <p role="alert">{loadError}</p>}
      {removeError && <p role="alert">{removeError}</p>}
      {!loadError && !result && <p role="status">Завантажуємо список…</p>}
      {result?.items.length === 0 && (
        <p>
          {filter
            ? "У списку немає фільмів із цим статусом."
            : "У списку поки немає фільмів."}
        </p>
      )}

      {result && result.items.length > 0 && (
        <ul className="movie-grid">
          {result.items.map((movie) => (
            <li key={movie.movieId}>
              <article>
                {movie.posterUrl && (
                  <img src={movie.posterUrl} alt="" width={160} loading="lazy" />
                )}
                <h2>{movie.title}</h2>
                {movie.releaseYear !== null && <p>{movie.releaseYear}</p>}
                <p>{statusLabels[movie.status]}</p>
                <p>
                  <button
                    type="button"
                    aria-label={`Видалити «${movie.title}» зі списку`}
                    disabled={removingId !== null}
                    onClick={() => void handleRemove(movie.movieId, movie.title)}
                  >
                    {removingId === movie.movieId ? "Видаляємо…" : "Видалити"}
                  </button>
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}

      {result && totalPages > 1 && (
        <nav aria-label="Сторінки мого списку">
          <button
            type="button"
            disabled={page === 1 || removingId !== null}
            onClick={() => goToPage(page - 1)}
          >
            Назад
          </button>
          <span>Сторінка {page} з {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages || removingId !== null}
            onClick={() => goToPage(page + 1)}
          >
            Далі
          </button>
        </nav>
      )}
    </main>
  );
}