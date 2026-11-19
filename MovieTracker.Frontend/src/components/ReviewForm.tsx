import { useEffect, useState, type FormEvent } from "react";
import { deleteMyReview, getMyReview, saveMyReview } from "../api/reviews";

type ReviewFormProps = {
  accessToken: string;
  movieId: number;
  onSaved: () => void;
};

export default function ReviewForm({
  accessToken,
  movieId,
  onSaved,
}: ReviewFormProps) {
  const [rating, setRating] = useState("");
  const [text, setText] = useState("");
  const [hasReview, setHasReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState<"save" | "delete" | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  const isBusy = action !== null;

  useEffect(() => {
    const controller = new AbortController();

    async function loadReview() {
      try {
        const review = await getMyReview(
          accessToken,
          movieId,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setHasReview(review !== null);
        setRating(review ? String(review.rating) : "");
        setText(review?.text ?? "");
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error ? error.message : "Не вдалося завантажити відгук.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadReview();
    return () => controller.abort();
  }, [accessToken, movieId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || isBusy || loadError) return;

    const score = Number(rating);
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      setActionError("Вибери оцінку від 1 до 10.");
      return;
    }

    setAction("save");
    setActionError("");
    setMessage("");

    try {
      const review = await saveMyReview(accessToken, movieId, {
        rating: score,
        text,
      });
      setHasReview(true);
      setRating(String(review.rating));
      setText(review.text ?? "");
      setMessage("Відгук збережено.");
      onSaved();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не вдалося зберегти відгук.",
      );
    } finally {
      setAction(null);
    }
  }

  async function handleDelete() {
    if (isBusy || !hasReview) return;
    if (!window.confirm("Видалити твій відгук разом з оцінкою?")) return;

    setAction("delete");
    setActionError("");
    setMessage("");

    try {
      await deleteMyReview(accessToken, movieId);
      setHasReview(false);
      setRating("");
      setText("");
      setMessage("Відгук видалено.");
      onSaved();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не вдалося видалити відгук.",
      );
    } finally {
      setAction(null);
    }
  }

  if (isLoading) return <p role="status">Завантажуємо твій відгук…</p>;
  if (loadError) return <p role="alert">{loadError}</p>;

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Твій відгук</h3>

      <p>
        <label htmlFor="review-rating">Оцінка</label>
        <select
          id="review-rating"
          value={rating}
          onChange={(event) => {
            setRating(event.target.value);
            setMessage("");
          }}
          required
          disabled={isBusy}
        >
          <option value="" disabled>Вибери від 1 до 10</option>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
            <option key={score} value={score}>
              {score} / 10
            </option>
          ))}
        </select>
      </p>

      <p>
        <label htmlFor="review-text">Текст відгуку (необов’язково)</label>
        <textarea
          id="review-text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setMessage("");
          }}
          rows={4}
          maxLength={2000}
          disabled={isBusy}
        />
      </p>

      <button type="submit" disabled={isBusy || !rating}>
        {action === "save" ? "Зберігаємо…" : "Зберегти відгук"}
      </button>

      {hasReview && (
        <button type="button" onClick={handleDelete} disabled={isBusy}>
          {action === "delete" ? "Видаляємо…" : "Видалити відгук"}
        </button>
      )}

      {message && <p role="status">{message}</p>}
      {actionError && <p role="alert">{actionError}</p>}
    </form>
  );
}