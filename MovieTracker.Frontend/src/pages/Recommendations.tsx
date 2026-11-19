import { useEffect, useState } from "react";

type RecommendedMovie = {
  id: number;
  title: string;
  releaseYear: number | null;
  posterUrl: string | null;
};

type RecommendationsResponse = {
  isPersonalized: boolean;
  items: RecommendedMovie[];
};

type RecommendationsProps = {
  accessToken: string;
  onBack: () => void;
  onOpenMovie: (movieId: number) => void;
};

export default function Recommendations({
  accessToken,
  onBack,
  onOpenMovie,
}: RecommendationsProps) {
  const [result, setResult] = useState<RecommendationsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecommendations() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/recommendations/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error("Увійди знову, щоб відкрити рекомендації.");
        }

        if (!response.ok) {
          throw new Error(
            `Не вдалося завантажити рекомендації (${response.status}).`,
          );
        }

        const data: RecommendationsResponse = await response.json();
        if (!controller.signal.aborted) setResult(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Не вдалося завантажити рекомендації.",
        );
      }
    }

    void loadRecommendations();
    return () => controller.abort();
  }, [accessToken]);

  return (
    <main>
      <button type="button" onClick={onBack}>← До каталогу</button>
      <h1>Рекомендації</h1>

      {error && <p role="alert">{error}</p>}
      {!error && !result && <p role="status">Завантажуємо добірку…</p>}
      {result?.items.length === 0 && <p>У добірці поки немає фільмів.</p>}

      {result && result.items.length > 0 && (
        <>
          <h2>{result.isPersonalized ? "Для тебе" : "Популярні фільми"}</h2>

          <ul className="movie-grid">
            {result.items.map((movie) => (
              <li key={movie.id}>
                <article>
                  {movie.posterUrl && (
                    <img
                      src={movie.posterUrl}
                      alt=""
                      width={160}
                      loading="lazy"
                    />
                  )}
                  <h3>
                    <button type="button" onClick={() => onOpenMovie(movie.id)}>
                      {movie.title}
                    </button>
                  </h3>
                  {movie.releaseYear !== null && <p>{movie.releaseYear}</p>}
                </article>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}