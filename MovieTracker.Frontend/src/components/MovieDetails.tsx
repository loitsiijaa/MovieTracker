import { useEffect, useState } from "react";
import PublicProfilePage from "../pages/PublicProfile";
import AddToCollectionForm from "./AddToCollectionForm";
import MovieReviews from "./MovieReviews";
import WatchStatusForm from "./WatchStatusForm";
import "../styles/movie-details.css";
import "../styles/movie-reviews.css";

type MoviePerson = {
  personId: number;
  fullName: string;
  photoUrl: string | null;
  role: string | null;
};

type MovieDetailsData = {
  title: string;
  description: string | null;
  releaseYear: number | null;
  rating: number | null;
  posterUrl: string | null;
  genres: { id: number; name: string }[];
  moviePersons: MoviePerson[];
};

type MovieDetailsProps = {
  movieId: number;
  accessToken?: string;
  onBack: () => void;
};

export default function MovieDetails({
  movieId,
  accessToken,
  onBack,
}: MovieDetailsProps) {
  const [movie, setMovie] = useState<MovieDetailsData | null>(null);
  const [error, setError] = useState("");
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [returnToReviews, setReturnToReviews] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMovie() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/movies/${movieId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Не вдалося завантажити фільм (${response.status}).`);
        }

        const data: MovieDetailsData = await response.json();
        if (!controller.signal.aborted) setMovie(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Не вдалося завантажити фільм.",
        );
      }
    }

    void loadMovie();
    return () => controller.abort();
  }, [movieId]);

  useEffect(() => {
    if (authorId !== null) {
      window.scrollTo(0, 0);
      return;
    }

    if (returnToReviews) {
      const heading = document.getElementById("movie-reviews-heading");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start" });
    }
  }, [authorId, returnToReviews]);

  if (authorId !== null) {
    return (
      <PublicProfilePage
        key={authorId}
        userId={authorId}
        accessToken={accessToken}
        onBack={() => {
          setAuthorId(null);
          setReturnToReviews(true);
        }}
      />
    );
  }

  return (
    <main className="movie-details">
      <button className="movie-details__back" type="button" onClick={onBack}>
        ← Назад
      </button>

      {error && <p role="alert">{error}</p>}
      {!error && !movie && <p role="status">Завантажуємо деталі фільму…</p>}

      {movie && (
        <article>
          <header
            className={
              movie.posterUrl
                ? "movie-details__hero movie-details__hero--with-poster"
                : "movie-details__hero"
            }
          >
            {movie.posterUrl && (
              <>
                <img
                  className="movie-details__backdrop"
                  src={movie.posterUrl}
                  alt=""
                />
                <img
                  className="movie-details__poster"
                  src={movie.posterUrl}
                  alt={`Постер фільму «${movie.title}»`}
                  width={230}
                  height={345}
                />
              </>
            )}

            <div>
              <h1 className="movie-details__title">{movie.title}</h1>

              {(movie.releaseYear !== null || movie.rating !== null) && (
                <p className="movie-details__meta">
                  {movie.releaseYear !== null && <span>{movie.releaseYear}</span>}
                  {movie.rating !== null && (
                    <span className="movie-details__rating">
                      Оцінка {movie.rating.toFixed(1)} / 10
                    </span>
                  )}
                </p>
              )}

              {movie.genres.length > 0 && (
                <p className="movie-details__genres">
                  {movie.genres.map((genre) => genre.name).join(" · ")}
                </p>
              )}

              {accessToken && (
                <>
                  <div className="movie-details__status">
                    <WatchStatusForm
                      movieId={movieId}
                      accessToken={accessToken}
                    />
                  </div>
                  <div className="movie-details__status">
                    <AddToCollectionForm
                      movieId={movieId}
                      accessToken={accessToken}
                    />
                  </div>
                </>
              )}
            </div>
          </header>

          <h2>Опис</h2>
          <p className="movie-details__description">
            {movie.description || "Опис поки відсутній."}
          </p>

          {movie.moviePersons.length > 0 && (
            <section aria-labelledby="movie-cast-heading">
              <h2 id="movie-cast-heading">Актори</h2>
              <ul className="movie-details__cast">
                {movie.moviePersons.map((person, index) => (
                  <li key={`${person.personId}-${index}`}>
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt="" loading="lazy" />
                    ) : (
                      <div
                        className="movie-details__cast-placeholder"
                        aria-hidden="true"
                      >
                        {person.fullName.charAt(0)}
                      </div>
                    )}
                    <strong>{person.fullName}</strong>
                    {person.role && <span>{person.role}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <MovieReviews
            movieId={movieId}
            accessToken={accessToken}
            onOpenProfile={setAuthorId}
          />
        </article>
      )}
    </main>
  );
}