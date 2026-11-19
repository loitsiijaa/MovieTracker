import { useState, type FormEvent } from "react";
import { register, type AuthSession } from "../api/auth";

type RegisterFormProps = {
  onSuccess: (session: AuthSession) => void;
  onBack: () => void;
};

export default function RegisterForm({ onSuccess, onBack }: RegisterFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get("displayName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (displayName.length < 2) {
      setError("Введи ім’я щонайменше з двох символів.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const session = await register({ displayName, email, password });
      onSuccess(session);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Не вдалося створити акаунт.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <button type="button" onClick={onBack} disabled={isSubmitting}>
        До каталогу
      </button>

      <h1>Реєстрація в MovieTracker</h1>

      <form onSubmit={handleSubmit}>
        <p>
          <label htmlFor="register-name">Ім’я в профілі</label>
          <br />
          <input
            id="register-name"
            name="displayName"
            autoComplete="nickname"
            minLength={2}
            maxLength={50}
            required
          />
        </p>

        <p>
          <label htmlFor="register-email">Електронна пошта</label>
          <br />
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="username"
            maxLength={256}
            required
          />
        </p>

        <p>
          <label htmlFor="register-password">Пароль</label>
          <br />
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="register-password-hint"
            minLength={8}
            maxLength={100}
            required
          />
          <br />
          <small id="register-password-hint">Щонайменше 8 символів.</small>
        </p>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Створюємо акаунт…" : "Створити акаунт"}
        </button>
      </form>
    </main>
  );
}