import { useEffect, useState } from "react";
import type { AuthSession } from "./api/auth";
import LoginForm from "./auth/LoginForm";
import RegisterForm from "./auth/RegisterForm";
import AccountMenu from "./components/AccountMenu";
import MovieDetails from "./components/MovieDetails";
import NotificationsButton from "./components/NotificationsButton";
import { movieGenres } from "./lib/genres";
import ActivityFeed from "./pages/ActivityFeed";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import PublicProfilePage from "./pages/PublicProfile";
import Recommendations from "./pages/Recommendations";
import Watchlist from "./pages/Watchlist";
import "./styles/catalog.css";

type Movie = {
  id: number;
  title: string;
  releaseYear: number | null;
  posterUrl: string | null;
};

type MoviesResponse = {
  items: Movie[];
  totalPages: number;
};

type AccountPage =
  | "profile"
  | "watchlist"
  | "recommendations"
  | "notifications"
  | "feed";

export default function App() {
  const [page, setPage] = useState(1);
  const [authScreen, setAuthScreen] = useState<"login" | "register" | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [accountPage, setAccountPage] = useState<AccountPage | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [publicUserId, setPublicUserId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [genreId, setGenreId] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [error, setError] = useState("");

  function goToPage(nextPage: number) {
    setMovies(null);
    setError("");
    setPage(nextPage);
  }

  function handleAuthSuccess(newSession: AuthSession) {
    setSession(newSession);
    setAuthScreen(null);
  }

  function returnToCatalog() {
    setPublicUserId(null);
    setAccountPage(null);
  }

  function handleLogout() {
    setSession(null);
    returnToCatalog();
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadMovies() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const params = new URLSearchParams({ page: String(page) });

        if (query) params.set("query", query);
        if (genreId) params.set("genreId", genreId);

        const path = query || genreId ? "/api/movies" : "/api/movies/popular";
        const response = await fetch(`${apiUrl}${path}?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Помилка сервера (${response.status}).`);
        }

        const data: MoviesResponse = await response.json();
        if (controller.signal.aborted) return;

        setMovies(data.items);
        setTotalPages(Math.max(1, data.totalPages));
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Не вдалося завантажити фільми.",
        );
      }
    }

    void loadMovies();
    return () => controller.abort();
  }, [page, query, genreId]);

  if (authScreen === "login") {
    return (
      <LoginForm
        onBack={() => setAuthScreen(null)}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (authScreen === "register") {
    return (
      <RegisterForm
        onBack={() => setAuthScreen(null)}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (selectedMovieId !== null) {
    return (
      <MovieDetails
        movieId={selectedMovieId}
        accessToken={session?.accessToken}
        onBack={() => setSelectedMovieId(null)}
      />
    );
  }

  if (session && publicUserId !== null) {
    return (
      <PublicProfilePage
        key={publicUserId}
        userId={publicUserId}
        accessToken={session.accessToken}
        backLabel={accountPage === "feed" ? "← До стрічки" : "← До сповіщень"}
        onBack={() => setPublicUserId(null)}
      />
    );
  }

  if (session && accountPage === "feed") {
    return (
      <ActivityFeed
        accessToken={session.accessToken}
        onBack={returnToCatalog}
        onOpenMovie={setSelectedMovieId}
        onOpenProfile={setPublicUserId}
      />
    );
  }

  if (session && accountPage === "notifications") {
    return (
      <Notifications
        accessToken={session.accessToken}
        onBack={returnToCatalog}
        onOpenProfile={setPublicUserId}
      />
    );
  }

  if (session && accountPage === "profile") {
    return (
      <Profile
        accessToken={session.accessToken}
        onBack={returnToCatalog}
        onOpenMovie={setSelectedMovieId}
      />
    );
  }

  if (session && accountPage === "watchlist") {
    return (
      <Watchlist
        accessToken={session.accessToken}
        onBack={returnToCatalog}
      />
    );
  }

  if (session && accountPage === "recommendations") {
    return (
      <Recommendations
        accessToken={session.accessToken}
        onBack={returnToCatalog}
        onOpenMovie={setSelectedMovieId}
      />
    );
  }

  const genreName = movieGenres.find((genre) => String(genre.id) === genreId)?.name;
  const heading = query
    ? `Результати пошуку: ${query}`
    : genreName ?? "Популярні фільми";

  return (
    <main>
      <header className="catalog-header">
        <h1>MovieTracker</h1>

        <nav className="account-nav" aria-label="Акаунт">
          {session ? (
            <>
              <button
                className="account-link"
                type="button"
                onClick={() => setAccountPage("feed")}
              >
                Стрічка
              </button>
              <button
                className="account-link"
                type="button"
                onClick={() => setAccountPage("recommendations")}
              >
                Рекомендації
              </button>
              <button
                className="account-link"
                type="button"
                onClick={() => setAccountPage("watchlist")}
              >
                Мій список
              </button>

              <NotificationsButton
                accessToken={session.accessToken}
                onClick={() => setAccountPage("notifications")}
              />

              <AccountMenu
                accessToken={session.accessToken}
                onOpenProfile={() => setAccountPage("profile")}
                onLogout={handleLogout}
              />
            </>
          ) : (
            <>
              <button
                className="account-link"
                type="button"
                onClick={() => setAuthScreen("login")}
              >
                Увійти
              </button>
              <button type="button" onClick={() => setAuthScreen("register")}>
                Створити акаунт
              </button>
            </>
          )}
        </nav>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();

          const nextQuery = searchInput.trim();
          if (nextQuery === query && page === 1) return;

          setQuery(nextQuery);
          setTotalPages(1);
          goToPage(1);
        }}
      >
        <label htmlFor="movie-search">Назва фільму</label>
        <input
          id="movie-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <button type="submit">Знайти</button>
      </form>

      <p>
        <label htmlFor="movie-genre">Жанр</label>
        <select
          id="movie-genre"
          value={genreId}
          onChange={(event) => {
            setGenreId(event.target.value);
            setTotalPages(1);
            goToPage(1);
          }}
        >
          <option value="">Усі жанри</option>
          {movieGenres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </p>

      <h2>{heading}</h2>

      <nav aria-label="Сторінки каталогу">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          Назад
        </button>
        <span>Сторінка {page} з {totalPages}</span>
        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          Далі
        </button>
      </nav>

      {error && <p role="alert">Не вдалося завантажити каталог. {error}</p>}
      {!error && movies === null && <p role="status">Завантажуємо фільми…</p>}
      {movies?.length === 0 && <p>На цій сторінці фільмів не знайдено.</p>}

      {movies && movies.length > 0 && (
        <ul className="movie-grid">
          {movies.map((movie) => (
            <li key={movie.id}>
              <article>
                {movie.posterUrl && (
                  <img
                    src={movie.posterUrl}
                    alt={`Постер фільму «${movie.title}»`}
                    width={160}
                    loading="lazy"
                  />
                )}
                <h3>
                  <button
                    type="button"
                    onClick={() => setSelectedMovieId(movie.id)}
                  >
                    {movie.title}
                  </button>
                </h3>
                {movie.releaseYear !== null && <p>{movie.releaseYear}</p>}
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}