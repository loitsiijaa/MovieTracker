import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, register } from "../api/auth";

const apiUrl = "https://example.test";

beforeEach(() => {
  vi.stubEnv("VITE_API_URL", apiUrl);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Вхід і реєстрація", () => {
  it("надсилає дані входу й повертає сесію", async () => {
    const session = {
      accessToken: "test-access-token",
      accessTokenExpiresAt: "2026-12-01T12:00:00Z",
      refreshToken: "test-refresh-token",
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(session));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({ email: "  viewer@example.test  ", password: "  TestPassword1!  " }),
    ).resolves.toEqual(session);

    expect(fetchMock).toHaveBeenCalledWith(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "viewer@example.test",
        password: "  TestPassword1!  ",
      }),
    });
  });

  it("показує повідомлення, якщо сервер відхилив дані входу", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(
      login({ email: "viewer@example.test", password: "wrong-password" }),
    ).rejects.toThrow("Неправильна електронна пошта або пароль.");
  });

  it("передає повідомлення бекенду про помилку реєстрації", async () => {
    const message = "Ця електронна пошта вже використовується.";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { errors: { DuplicateEmail: [message] } },
          { status: 400 },
        ),
      ),
    );

    await expect(
      register({
        displayName: "Кіноглядач",
        email: "viewer@example.test",
        password: "TestPassword1!",
      }),
    ).rejects.toThrow(message);
  });
});