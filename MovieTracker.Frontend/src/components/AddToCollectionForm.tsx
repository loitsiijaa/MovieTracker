import { useEffect, useState, type FormEvent } from "react";
import { getMyCollections, type ProfileCollection } from "../api/profile";

type AddToCollectionFormProps = {
  accessToken: string;
  movieId: number;
};

export default function AddToCollectionForm({
  accessToken,
  movieId,
}: AddToCollectionFormProps) {
  const [collections, setCollections] = useState<ProfileCollection[] | null>(null);
  const [collectionId, setCollectionId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getMyCollections(accessToken, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setCollections(items);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error ? error.message : "Не вдалося завантажити колекції.",
        );
      });

    return () => controller.abort();
  }, [accessToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const collection = collections?.find((item) => item.id === collectionId);
    if (isSaving || !collection) return;

    setIsSaving(true);
    setSaveError("");
    setMessage("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const id = encodeURIComponent(collection.id);
      const response = await fetch(
        `${apiUrl}/api/collections/${id}/movies/${movieId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.status === 401) {
        throw new Error("Увійди знову, щоб додати фільм.");
      }

      if (response.status === 404) {
        throw new Error("Колекцію або фільм не знайдено.");
      }

      if (!response.ok) {
        throw new Error(`Не вдалося додати фільм (${response.status}).`);
      }

      setMessage(`Фільм є в колекції «${collection.name}».`);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Не вдалося додати фільм.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loadError) return <p role="alert">{loadError}</p>;
  if (!collections) return <p role="status">Завантажуємо твої колекції…</p>;

  if (collections.length === 0) {
    return <p>Спочатку створи колекцію в розділі «Мій профіль».</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="movie-collection">Додати до колекції</label>{" "}
      <select
        id="movie-collection"
        value={collectionId}
        onChange={(event) => {
          setCollectionId(event.target.value);
          setSaveError("");
          setMessage("");
        }}
        required
        disabled={isSaving}
      >
        <option value="" disabled>Вибери колекцію</option>
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.name} · {collection.isPublic ? "публічна" : "приватна"}
          </option>
        ))}
      </select>{" "}
      <button type="submit" disabled={isSaving || !collectionId}>
        {isSaving ? "Додаємо…" : "Додати"}
      </button>

      {message && <p role="status">{message}</p>}
      {saveError && <p role="alert">{saveError}</p>}
    </form>
  );
}