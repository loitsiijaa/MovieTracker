export type MovieTrackerNotification = {
  id: string;
  type: string;
  text: string;
  actorId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsPage = {
  page: number;
  totalPages: number;
  totalResults: number;
  items: MovieTrackerNotification[];
};

async function requestNotifications(
  accessToken: string,
  path: string,
  options: Pick<RequestInit, "method" | "signal"> = {},
): Promise<Response> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/api/notifications${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб переглянути сповіщення.");
  }

  if (response.status === 404) {
    throw new Error("Сповіщення не знайдено.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося виконати запит (${response.status}).`);
  }

  return response;
}

export async function getNotifications(
  accessToken: string,
  page: number,
  unreadOnly: boolean,
  signal?: AbortSignal,
): Promise<NotificationsPage> {
  const params = new URLSearchParams({
    page: String(page),
    unreadOnly: String(unreadOnly),
  });

  const response = await requestNotifications(accessToken, `/me?${params}`, {
    signal,
  });

  return response.json();
}

export async function markNotificationRead(
  accessToken: string,
  notificationId: string,
): Promise<void> {
  const id = encodeURIComponent(notificationId);
  await requestNotifications(accessToken, `/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(
  accessToken: string,
): Promise<void> {
  await requestNotifications(accessToken, "/read-all", { method: "POST" });
}