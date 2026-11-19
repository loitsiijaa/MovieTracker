import { useEffect, useState } from "react";
import {
  getProfileReviews,
  getPublicCollections,
  getPublicProfile,
  type ProfileCollection,
  type ProfileReviewsPage,
  type PublicProfile,
} from "../api/profile";
import CollectionDetails from "../components/CollectionDetails";
import FollowPanel from "../components/FollowPanel";
import MovieDetails from "../components/MovieDetails";

type PublicProfileProps = {
  userId: string;
  accessToken?: string;
  onBack: () => void;
  backLabel?: string;
};

type ProfileContent = {
  profile: PublicProfile;
  collections: ProfileCollection[];
};

export default function PublicProfilePage(props: PublicProfileProps) {
  return <PublicProfileContent key={props.userId} {...props} />;
}

function PublicProfileContent({
  userId,
  accessToken,
  onBack,
  backLabel = "← Назад до фільму",
}: PublicProfileProps) {
  const [content, setContent] = useState<ProfileContent | null>(null);
  const [profileError, setProfileError] = useState("");
  const [reviews, setReviews] = useState<ProfileReviewsPage | null>(null);
  const [reviewsError, setReviewsError] = useState("");
  const [page, setPage] = useState(1);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [movieId, setMovieId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const [profile, collections] = await Promise.all([
          getPublicProfile(userId, controller.signal),
          getPublicCollections(userId, controller.signal),
        ]);

        if (!controller.signal.aborted) {
          setContent({ profile, collections });
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setProfileError(
          error instanceof Error ? error.message : "Не вдалося відкрити профіль.",
        );
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        const result = await getProfileReviews(userId, page, controller.signal);
        if (!controller.signal.aborted) setReviews(result);
      } catch (error) {
        if (controller.signal.aborted) return;

        setReviewsError(
          error instanceof Error ? error.message : "Не вдалося завантажити відгуки.",
        );
      }
    }

    void loadReviews();
    return () => controller.abort();
  }, [userId, page]);

  function goToPage(nextPage: number) {
    setReviews(null);
    setReviewsError("");
    setPage(nextPage);
  }

  const totalPages = reviews
    ? Math.max(1, Math.ceil(reviews.totalCount / reviews.pageSize))
    : 1;

  if (movieId !== null) {
    return (
      <MovieDetails
        key={movieId}
        movieId={movieId}
        accessToken={accessToken}
        onBack={() => setMovieId(null)}
      />
    );
  }

  if (collectionId !== null) {
    return (
      <CollectionDetails
        key={collectionId}
        collectionId={collectionId}
        onBack={() => setCollectionId(null)}
        onOpenMovie={setMovieId}
      />
    );
  }

  return (
    <main>
      <button type="button" onClick={onBack}>{backLabel}</button>

      {profileError && <p role="alert">{profileError}</p>}
      {!profileError && !content && <p role="status">Завантажуємо профіль…</p>}

      {content && (
        <>
          <header>
            {content.profile.avatarUrl?.startsWith("https://") && (
              <img
                src={content.profile.avatarUrl}
                alt=""
                width={80}
                height={80}
                referrerPolicy="no-referrer"
              />
            )}
            <h1>{content.profile.displayName}</h1>
            {content.profile.bio && <p>{content.profile.bio}</p>}
            <FollowPanel userId={userId} accessToken={accessToken} />
          </header>

          <section aria-labelledby="public-collections-heading">
            <h2 id="public-collections-heading">Публічні колекції</h2>

            {content.collections.length === 0 ? (
              <p>У цього користувача поки немає публічних колекцій.</p>
            ) : (
              <ul className="movie-reviews__list">
                {content.collections.map((collection) => (
                  <li key={collection.id} className="movie-reviews__card">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setCollectionId(collection.id)}
                      >
                        {collection.name}
                      </button>
                    </h3>
                    <p>Фільмів: {collection.moviesCount}</p>
                    {collection.description && <p>{collection.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="public-reviews-heading">
            <h2 id="public-reviews-heading">Відгуки</h2>

            {reviewsError && <p role="alert">{reviewsError}</p>}
            {!reviewsError && !reviews && (
              <p role="status">Завантажуємо відгуки…</p>
            )}
            {reviews?.totalCount === 0 && <p>Цей користувач ще не має відгуків.</p>}

            {reviews && reviews.items.length > 0 && (
              <ul className="movie-reviews__list">
                {reviews.items.map((review) => (
                  <li key={review.id} className="movie-reviews__card">
                    <h3>{review.movieTitle}</h3>
                    <p className="movie-reviews__rating">
                      Оцінка {review.rating} / 10
                    </p>
                    {review.text && <p>{review.text}</p>}
                  </li>
                ))}
              </ul>
            )}

            {(totalPages > 1 || page > 1) && (
              <nav aria-label="Сторінки відгуків користувача">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Назад
                </button>{" "}
                <span>Сторінка {page}</span>{" "}
                <button
                  type="button"
                  disabled={!reviews || page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Далі
                </button>
              </nav>
            )}
          </section>
        </>
      )}
    </main>
  );
}