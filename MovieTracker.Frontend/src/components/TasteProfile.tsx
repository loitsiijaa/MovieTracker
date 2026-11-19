import { useEffect, useState } from "react";
import { movieGenres } from "../lib/genres";

type GenrePreference = {
  genreId: number;
  genreName: string;
  reviewsCount: number;
};

type TasteProfileData = {
  reviewsCount: number;
  genrePreferences: GenrePreference[];
  favoriteGenreIds: number[];
  confidence: number;
};

async function requestTasteProfile(
  accessToken: string,
  action: "load" | "analyze",
  signal?: AbortSignal,
): Promise<TasteProfileData | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const path = action === "load" ? "me" : "analyze";
  const response = await fetch(`${apiUrl}/api/taste-profile/${path}`, {
    method: action === "load" ? "GET" : "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  if (action === "load" && response.status === 404) return null;

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб відкрити смаковий профіль.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося отримати смаковий профіль (${response.status}).`);
  }

  return response.json();
}

export default function TasteProfile({ accessToken }: { accessToken: string }) {
  const [profile, setProfile] = useState<TasteProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const result = await requestTasteProfile(
          accessToken,
          "load",
          controller.signal,
        );
        if (!controller.signal.aborted) setProfile(result);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Не вдалося завантажити аналіз.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [accessToken]);

  async function handleAnalyze() {
    if (isLoading || isAnalyzing) return;

    setIsAnalyzing(true);
    setError("");
    setMessage("");

    try {
      const result = await requestTasteProfile(accessToken, "analyze");
      setProfile(result);
      setMessage("Аналіз оновлено.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Не вдалося виконати аналіз.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function getGenreName(genreId: number) {
    return (
      profile?.genrePreferences.find((genre) => genre.genreId === genreId)
        ?.genreName ||
      movieGenres.find((genre) => genre.id === genreId)?.name ||
      `Жанр ${genreId}`
    );
  }

  const favoriteGenres = profile?.favoriteGenreIds.map(getGenreName) ?? [];

  return (
    <section aria-labelledby="taste-profile-heading">
      <h2 id="taste-profile-heading">Смаковий профіль</h2>

      {isLoading && <p role="status">Завантажуємо аналіз…</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {!isLoading && !error && !profile && (
        <p>Запусти аналіз, щоб побачити добірку жанрів за своїми оцінками.</p>
      )}

      {profile && (
        <>
          <p>Враховано відгуків: {profile.reviewsCount}</p>

          {profile.reviewsCount === 0 ? (
            <p>Залиш оцінку фільму, щоб у профілі з’явилися дані для аналізу.</p>
          ) : (
            <>
              <p>Впевненість аналізу: {Math.round(profile.confidence * 100)}%</p>
              <p>
                {favoriteGenres.length > 0
                  ? `Улюблені жанри: ${favoriteGenres.join(", ")}`
                  : "Поки замало даних, щоб визначити улюблені жанри."}
              </p>
            </>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => void handleAnalyze()}
        disabled={isLoading || isAnalyzing}
      >
        {isAnalyzing
          ? "Аналізуємо…"
          : profile
            ? "Оновити аналіз"
            : "Проаналізувати оцінки"}
      </button>
    </section>
  );
}