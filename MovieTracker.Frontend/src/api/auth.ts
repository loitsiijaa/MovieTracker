type LoginRequest = {
  email: string;
  password: string;
};

type RegisterRequest = {
  displayName: string;
  email: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
};

export async function login(credentials: LoginRequest): Promise<AuthSession> {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: credentials.email.trim(),
      password: credentials.password,
    }),
  });

  if (response.status === 401) {
    throw new Error("Неправильна електронна пошта або пароль.");
  }

  if (response.status === 423) {
    throw new Error("Забагато спроб входу. Спробуй пізніше.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося увійти. Код помилки: ${response.status}.`);
  }

  return response.json();
}

export async function register(
  credentials: RegisterRequest,
): Promise<AuthSession> {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: credentials.displayName.trim(),
      email: credentials.email.trim(),
      password: credentials.password,
    }),
  });

  if (response.status === 400) {
    const problem: { errors?: Record<string, string[]> } =
      await response.json().catch(() => ({}));
    const message = Object.values(problem.errors ?? {}).flat().join(" ");

    throw new Error(message || "Перевір ім’я, пошту та пароль.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося створити акаунт. Код помилки: ${response.status}.`);
  }

  return response.json();
}