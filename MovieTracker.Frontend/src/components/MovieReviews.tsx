import { useEffect, useState } from "react";
import ReviewForm from "./ReviewForm";

type Review = {
  id: string;
  userId: string;
  authorName: string;
  rating: number;
  text: string | null;
};

type ReviewsResponse = {
  averageRating: number | null;
  totalReviews: number;
  items: Review[];
};

type MovieReviewsProps = {
  movieId: number;
  accessToken?: string;
  onOpenProfile: (userId: string) => void;
};

export default function MovieReviews({
  movieId,
  accessToken,
  onOpenProfile,
}: MovieReviewsProps) {
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(
          `${apiUrl}/api/movies/${movieId}/reviews?pageSize=6`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Не вдалося завантажити відгуки (${response.status}).`);
        }

        const data: ReviewsResponse = await response.json();
        if (controller.signal.aborted) return;

        setReviews(data);
        setError("");
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Не вдалося завантажити відгуки.",
        );
      }
    }

    void loadReviews();
    return () => controller.abort();
  }, [movieId, refreshCount]);

  return (
    <section aria-labelledby="movie-reviews-heading">
      <h2 id="movie-reviews-heading" tabIndex={-1}>Відгуки глядачів</h2>

      {accessToken && (
        <ReviewForm
          movieId={movieId}
          accessToken={accessToken}
          onSaved={() => setRefreshCount((count) => count + 1)}
        />
      )}

      {error && <p role="alert">{error}</p>}
      {!error && !reviews && <p role="status">Завантажуємо відгуки…</p>}

      {reviews?.totalReviews === 0 && (
        <p>Для цього фільму ще немає відгуків.</p>
      )}

      {reviews && reviews.totalReviews > 0 && (
        <>
          <p className="movie-reviews__summary">
            {reviews.averageRating !== null && (
              <strong>Середня оцінка {reviews.averageRating} / 10 · </strong>
            )}
            Усього відгуків {reviews.totalReviews}
          </p>

          <ul className="movie-reviews__list">
            {reviews.items.map((review) => (
              <li key={review.id} className="movie-reviews__card">
                <h3>
                  <button
                    type="button"
                    onClick={() => onOpenProfile(review.userId)}
                  >
                    {review.authorName}
                  </button>
                </h3>
                <p className="movie-reviews__rating">
                  Оцінка {review.rating} / 10
                </p>
                {review.text && <p>{review.text}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}