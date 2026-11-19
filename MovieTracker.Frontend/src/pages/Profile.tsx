import { useEffect, useState } from "react";
import {
  getMyCollections,
  getMyProfile,
  getProfileReviews,
  type MyProfile,
  type ProfileCollection,
  type ProfileReviewsPage,
} from "../api/profile";
import CollectionDetails from "../components/CollectionDetails";
import CreateCollectionForm from "../components/CreateCollectionForm";
import EditProfileForm from "../components/EditProfileForm";
import MovieDetails from "../components/MovieDetails";
import TasteProfile from "../components/TasteProfile";

type ProfileProps = {
  accessToken: string;
  onBack: () => void;
  onOpenMovie: (movieId: number) => void;
};

export default function Profile({
  accessToken,
  onBack,
  onOpenMovie,
}: ProfileProps) {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  const [collections, setCollections] = useState<ProfileCollection[] | null>(null);
  const [collectionsError, setCollectionsError] = useState("");
  const [reviews, setReviews] = useState<ProfileReviewsPage | null>(null);
  const [reviewsError, setReviewsError] = useState("");
  const [page, setPage] = useState(1);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [collectionMovieId, setCollectionMovieId] = useState<number | null>(null);

  const userId = profile?.id;

  useEffect(() => {
    const controller = new AbortController();

    getMyProfile(accessToken, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setProfile(result);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setProfileError(
          error instanceof Error ? error.message : "Не вдалося завантажити профіль.",
        );
      });

    return () => controller.abort();
  }, [accessToken]);

  useEffect(() => {
    if (collectionId !== null) return;

    const controller = new AbortController();

    getMyCollections(accessToken, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;

        setCollections(items);
        setCollectionsError("");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setCollectionsError(
          error instanceof Error ? error.message : "Не вдалося завантажити колекції.",
        );
      });

    return () => controller.abort();
  }, [accessToken, collectionId]);

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    getProfileReviews(userId, page, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setReviews(result);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setReviewsError(
          error instanceof Error ? error.message : "Не вдалося завантажити відгуки.",
        );
      });

    return () => controller.abort();
  }, [userId, page]);

  function handleCollectionCreated(collection: ProfileCollection) {
    setCollections((current) => [collection, ...(current ?? [])]);
  }

  function goToReviewPage(nextPage: number) {
    setReviews(null);
    setReviewsError("");
    setPage(nextPage);
  }

  const totalReviewPages = reviews
    ? Math.max(1, Math.ceil(reviews.totalCount / reviews.pageSize))
    : 1;

  if (collectionMovieId !== null) {
    return (
      <MovieDetails
        movieId={collectionMovieId}
        accessToken={accessToken}
        onBack={() => setCollectionMovieId(null)}
      />
    );
  }

  if (collectionId !== null) {
    return (
      <CollectionDetails
        collectionId={collectionId}
        accessToken={accessToken}
        canManage
        onBack={() => setCollectionId(null)}
        onOpenMovie={setCollectionMovieId}
    />
    );
  }

  return (
    <main>
      <button type="button" onClick={onBack}>← До каталогу</button>
      <h1>Мій профіль</h1>

      {profileError && <p role="alert">{profileError}</p>}
      {!profileError && !profile && <p role="status">Завантажуємо профіль…</p>}

      {profile && (
        <>
          <section aria-labelledby="profile-name">
            {profile.avatarUrl?.startsWith("https://") && (
              <img
                src={profile.avatarUrl}
                alt=""
                width={80}
                height={80}
                referrerPolicy="no-referrer"
              />
            )}
            <h2 id="profile-name">{profile.displayName}</h2>
            <p>{profile.email}</p>
            {profile.bio && <p>{profile.bio}</p>}

            <details>
              <summary>Редагувати профіль</summary>
              <EditProfileForm
                accessToken={accessToken}
                profile={profile}
                onSaved={setProfile}
              />
            </details>
          </section>

          <TasteProfile accessToken={accessToken} />

          <section aria-labelledby="profile-collections">
            <h2 id="profile-collections">Мої колекції</h2>

            {collectionsError && <p role="alert">{collectionsError}</p>}
            {!collectionsError && !collections && (
              <p role="status">Завантажуємо колекції…</p>
            )}

            {collections && (
              <>
                <details>
                  <summary>Нова колекція</summary>
                  <CreateCollectionForm
                    accessToken={accessToken}
                    onCreated={handleCollectionCreated}
                  />
                </details>

                {collections.length === 0 ? (
                  <p>У тебе ще немає колекцій.</p>
                ) : (
                  <ul className="movie-reviews__list">
                    {collections.map((collection) => (
                      <li key={collection.id} className="movie-reviews__card">
                        <h3>
                          <button
                            type="button"
                            onClick={() => setCollectionId(collection.id)}
                          >
                            {collection.name}
                          </button>
                        </h3>
                        <p>
                          {collection.isPublic ? "Публічна" : "Приватна"}
                          {" · "}Фільмів: {collection.moviesCount}
                        </p>
                        {collection.description && <p>{collection.description}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          <section aria-labelledby="profile-reviews">
            <h2 id="profile-reviews">Мої відгуки</h2>

            {reviewsError && <p role="alert">{reviewsError}</p>}
            {!reviewsError && !reviews && (
              <p role="status">Завантажуємо відгуки…</p>
            )}
            {reviews?.totalCount === 0 && <p>У тебе ще немає відгуків.</p>}

            {reviews && reviews.items.length > 0 && (
              <ul className="movie-reviews__list">
                {reviews.items.map((review) => (
                  <li key={review.id} className="movie-reviews__card">
                    <h3>
                      <button
                        type="button"
                        onClick={() => onOpenMovie(review.movieId)}
                      >
                        {review.movieTitle}
                      </button>
                    </h3>
                    <p className="movie-reviews__rating">
                      Оцінка {review.rating} / 10
                    </p>
                    {review.text && <p>{review.text}</p>}
                  </li>
                ))}
              </ul>
            )}

            {(totalReviewPages > 1 || page > 1) && (
              <nav aria-label="Сторінки моїх відгуків">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => goToReviewPage(page - 1)}
                >
                  Назад
                </button>{" "}
                <span>Сторінка {page}</span>{" "}
                <button
                  type="button"
                  disabled={!reviews || page >= totalReviewPages}
                  onClick={() => goToReviewPage(page + 1)}
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