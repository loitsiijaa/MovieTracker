import { useState, type FormEvent } from "react";
import type { MyProfile } from "../api/profile";

type EditProfileFormProps = {
  accessToken: string;
  profile: MyProfile;
  onSaved: (profile: MyProfile) => void;
};

export default function EditProfileForm({
  accessToken,
  profile,
  onSaved,
}: EditProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const fields = new FormData(event.currentTarget);
    const displayName = String(fields.get("displayName") ?? "").trim();
    const avatarUrl = String(fields.get("avatarUrl") ?? "").trim();
    const bio = String(fields.get("bio") ?? "").trim();

    setError("");
    setMessage("");

    if (displayName.length < 2) {
      setError("Ім’я має містити щонайменше два символи.");
      return;
    }

    if (avatarUrl && !avatarUrl.startsWith("https://")) {
      setError("Введи посилання на зображення, яке починається з https://.");
      return;
    }

    setIsSaving(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          avatarUrl: avatarUrl || null,
          bio: bio || null,
        }),
      });

      if (response.status === 401) {
        throw new Error("Увійди знову, щоб змінити профіль.");
      }

      if (response.status === 400) {
        throw new Error("Перевір ім’я, посилання на аватар і довжину опису.");
      }

      if (!response.ok) {
        throw new Error(`Не вдалося зберегти профіль (${response.status}).`);
      }

      const updatedProfile: MyProfile = await response.json();
      onSaved(updatedProfile);
      setMessage("Профіль збережено.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Не вдалося зберегти профіль.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <p>
        <label htmlFor="profile-display-name">Ім’я в профілі</label>
        <input
          id="profile-display-name"
          name="displayName"
          defaultValue={profile.displayName}
          minLength={2}
          maxLength={50}
          autoComplete="nickname"
          required
          disabled={isSaving}
        />
      </p>

      <p>
        <label htmlFor="profile-avatar-url">Посилання на аватар</label>
        <input
          id="profile-avatar-url"
          name="avatarUrl"
          type="url"
          placeholder="https://"
          defaultValue={profile.avatarUrl ?? ""}
          maxLength={500}
          disabled={isSaving}
        />
      </p>

      <p>
        <label htmlFor="profile-bio">Про себе</label>
        <textarea
          id="profile-bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={4}
          maxLength={500}
          disabled={isSaving}
        />
      </p>

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Зберігаємо…" : "Зберегти профіль"}
      </button>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}