import { useState, type FormEvent } from "react";
import { login, type AuthSession } from "../api/auth";
import "../styles/auth.css";

type LoginFormProps = {
  onSuccess: (session: AuthSession) => void;
  onBack: () => void;
};

export default function LoginForm({ onSuccess, onBack }: LoginFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError("");
    setIsSubmitting(true);

    try {
      const session = await login({ email, password });
      onSuccess(session);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не вдалося увійти.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <button type="button" onClick={onBack} disabled={isSubmitting}>
        ← До каталогу
      </button>

      <h1>Вхід у MovieTracker</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">Електронна пошта</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Входимо…" : "Увійти"}
        </button>
      </form>
    </main>
  );
}