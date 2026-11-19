import { useState, type FormEvent } from "react";
import type { ProfileCollection } from "../api/profile";

type CreateCollectionFormProps = {
  accessToken: string;
  onCreated: (collection: ProfileCollection) => void;
};

export default function CreateCollectionForm({
  accessToken,
  onCreated,
}: CreateCollectionFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const description = String(fields.get("description") ?? "").trim();

    setError("");
    setMessage("");

    if (!name) {
      setError("Введи назву колекції.");
      return;
    }

    setIsSaving(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/collections`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || null,
          isPublic: fields.has("isPublic"),
        }),
      });

      if (response.status === 401) {
        throw new Error("Увійди знову, щоб створити колекцію.");
      }

      if (!response.ok) {
        throw new Error(`Не вдалося створити колекцію (${response.status}).`);
      }

      const collection: ProfileCollection = await response.json();
      form.reset();
      onCreated(collection);
      setMessage(`Колекцію «${collection.name}» створено.`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Не вдалося створити колекцію.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Нова колекція</h3>

      <p>
        <label htmlFor="collection-name">Назва</label>
        <input
          id="collection-name"
          name="name"
          maxLength={100}
          required
          disabled={isSaving}
        />
      </p>

      <p>
        <label htmlFor="collection-description">Опис (необов’язково)</label>
        <textarea
          id="collection-description"
          name="description"
          rows={3}
          maxLength={1000}
          disabled={isSaving}
        />
      </p>

      <div>
        <input
          id="collection-is-public"
          name="isPublic"
          type="checkbox"
          disabled={isSaving}
        />{" "}
        <label htmlFor="collection-is-public">Публічна колекція</label>
      </div>

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Створюємо…" : "Створити колекцію"}
      </button>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}