import { useEffect, useState, type FormEvent } from "react";
import { getWatchStatus, saveWatchStatus } from "../api/watchlist";

type WatchStatusFormProps = {
  movieId: number;
  accessToken: string;
};

export default function WatchStatusForm({
  movieId,
  accessToken,
}: WatchStatusFormProps) {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatus() {
      try {
        const currentStatus = await getWatchStatus(
          accessToken,
          movieId,
          controller.signal,
        );
        if (!controller.signal.aborted) setStatus(currentStatus ?? "");
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error ? error.message : "Не вдалося завантажити статус.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadStatus();
    return () => controller.abort();
  }, [accessToken, movieId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || isSaving) return;
    if (status !== "Planned" && status !== "Watched" && status !== "Dropped") {
      return;
    }

    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      await saveWatchStatus(accessToken, movieId, status);
      setMessage("Статус збережено в «Моєму списку».");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Не вдалося зберегти фільм.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="watch-status">Статус у моєму списку</label>{" "}
      <select
        id="watch-status"
        value={status}
        required
        disabled={isLoading || isSaving}
        onChange={(event) => {
          setStatus(event.target.value);
          setMessage("");
          setError("");
        }}
      >
        <option value="" disabled>
          {isLoading ? "Завантажуємо статус…" : "Вибери статус"}
        </option>
        <option value="Planned">Заплановано</option>
        <option value="Watched">Переглянуто</option>
        <option value="Dropped">Закинуто</option>
      </select>{" "}
      <button type="submit" disabled={isLoading || isSaving || !status}>
        {isSaving ? "Зберігаємо…" : "Зберегти"}
      </button>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}