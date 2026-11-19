import { useEffect, useState, type FormEvent } from "react";
import { deleteCollection, updateCollection } from "../api/profile";

type CollectionMovie = {
  movieId: number;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
};

type CollectionData = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  movies: CollectionMovie[];
};

type CollectionDetailsProps = {
  collectionId: string;
  accessToken?: string;
  canManage?: boolean;
  onBack: () => void;
  onOpenMovie: (movieId: number) => void;
};

export default function CollectionDetails({
  collectionId,
  accessToken,
  canManage = false,
  onBack,
  onOpenMovie,
}: CollectionDetailsProps) {
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCollection() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const id = encodeURIComponent(collectionId);

        const response = await fetch(`${apiUrl}/api/collections/${id}`, {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error("Увійди знову, щоб відкрити цю колекцію.");
        }

        if (response.status === 403 || response.status === 404) {
          throw new Error("Колекцію не знайдено або вона недоступна.");
        }

        if (!response.ok) {
          throw new Error(`Не вдалося відкрити колекцію (${response.status}).`);
        }

        const data: CollectionData = await response.json();

        if (!controller.signal.aborted) {
          setCollection(data);
          setName(data.name);
          setDescription(data.description ?? "");
          setIsPublic(data.isPublic);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Не вдалося відкрити колекцію.",
        );
      }
    }

    void loadCollection();

    return () => controller.abort();
  }, [accessToken, collectionId]);

  function openEditForm() {
    if (!collection) return;

    setName(collection.name);
    setDescription(collection.description ?? "");
    setIsPublic(collection.isPublic);
    setActionError("");
    setMessage("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setActionError("");
    setIsEditing(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !collection || isSaving) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setActionError("Введи назву колекції.");
      return;
    }

    setActionError("");
    setMessage("");
    setIsSaving(true);

    try {
      await updateCollection(accessToken, collectionId, {
        name: trimmedName,
        description: description.trim() || null,
        isPublic,
      });

      setCollection((current) =>
        current
          ? {
              ...current,
              name: trimmedName,
              description: description.trim() || null,
              isPublic,
            }
          : current,
      );

      setMessage("Зміни в колекції збережено.");
      setIsEditing(false);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти колекцію.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveMovie(movie: CollectionMovie) {
    if (!accessToken || !canManage || removingId !== null) return;

    setRemovingId(movie.movieId);
    setActionError("");
    setMessage("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const id = encodeURIComponent(collectionId);

      const response = await fetch(
        `${apiUrl}/api/collections/${id}/movies/${movie.movieId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.status === 401) {
        throw new Error("Увійди знову, щоб змінити колекцію.");
      }

      if (response.status === 403 || response.status === 404) {
        throw new Error("Фільм або колекція вже недоступні.");
      }

      if (!response.ok) {
        throw new Error(`Не вдалося видалити фільм (${response.status}).`);
      }

      setCollection((current) =>
        current
          ? {
              ...current,
              movies: current.movies.filter(
                (item) => item.movieId !== movie.movieId,
              ),
            }
          : current,
      );

      setMessage(`«${movie.title}» видалено з колекції.`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не вдалося видалити фільм.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleDeleteCollection() {
    if (!accessToken || !canManage || isDeleting || !collection) return;

    const confirmed = window.confirm(
      `Видалити колекцію «${collection.name}»? Цю дію не можна скасувати.`,
    );

    if (!confirmed) return;

    setActionError("");
    setMessage("");
    setIsDeleting(true);

    try {
      await deleteCollection(accessToken, collectionId);
      onBack();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити колекцію.",
      );
      setIsDeleting(false);
    }
  }

  const isBusy = removingId !== null || isSaving || isDeleting;

  return (
    <main>
      <button type="button" onClick={onBack} disabled={isBusy}>
        ← До профілю
      </button>

      {loadError && <p role="alert">{loadError}</p>}
      {!loadError && !collection && (
        <p role="status">Завантажуємо колекцію…</p>
      )}

      {collection && (
        <>
          <section>
            <h1>{collection.name}</h1>

            <p>
              {collection.isPublic ? "Публічна колекція" : "Приватна колекція"}
              {" · "}Фільмів: {collection.movies.length}
            </p>

            {collection.description && <p>{collection.description}</p>}

            {canManage && accessToken && !isEditing && (
              <p>
                <button type="button" onClick={openEditForm} disabled={isBusy}>
                  Редагувати колекцію
                </button>{" "}
                <button
                  type="button"
                  onClick={() => void handleDeleteCollection()}
                  disabled={isBusy}
                >
                  {isDeleting ? "Видаляємо…" : "Видалити колекцію"}
                </button>
              </p>
            )}

            {isEditing && (
              <form onSubmit={handleSave}>
                <h2>Редагування колекції</h2>

                <p>
                  <label htmlFor="collection-name">Назва</label>
                  <br />
                  <input
                    id="collection-name"
                    value={name}
                    maxLength={100}
                    disabled={isSaving}
                    onChange={(event) => setName(event.target.value)}
                  />
                </p>

                <p>
                  <label htmlFor="collection-description">Опис</label>
                  <br />
                  <textarea
                    id="collection-description"
                    value={description}
                    maxLength={1000}
                    rows={4}
                    disabled={isSaving}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </p>

                <p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      disabled={isSaving}
                      onChange={(event) => setIsPublic(event.target.checked)}
                    />{" "}
                    Показувати цю колекцію у моєму публічному профілі
                  </label>
                </p>

                <button type="submit" disabled={isSaving}>
                  {isSaving ? "Зберігаємо…" : "Зберегти"}
                </button>{" "}
                <button type="button" onClick={cancelEdit} disabled={isSaving}>
                  Скасувати
                </button>
              </form>
            )}
          </section>

          {message && <p role="status">{message}</p>}
          {actionError && <p role="alert">{actionError}</p>}

          <section>
            <h2>Фільми у колекції</h2>

            {collection.movies.length === 0 ? (
              <p>У цій колекції поки немає фільмів.</p>
            ) : (
              <ul className="movie-grid">
                {collection.movies.map((movie) => (
                  <li key={movie.movieId}>
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
                          disabled={isBusy}
                          onClick={() => onOpenMovie(movie.movieId)}
                        >
                          {movie.title}
                        </button>
                      </h3>

                      {movie.releaseYear !== null && (
                        <p>{movie.releaseYear}</p>
                      )}

                      {canManage && accessToken && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleRemoveMovie(movie)}
                        >
                          {removingId === movie.movieId
                            ? "Видаляємо…"
                            : "Прибрати з колекції"}
                        </button>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}