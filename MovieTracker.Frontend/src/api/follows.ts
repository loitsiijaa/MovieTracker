export type FollowStats = {
  followersCount: number;
  followingCount: number;
  isFollowedByMe: boolean;
};

function followUrl(userId: string, action: "follow" | "follow-stats") {
  const apiUrl = import.meta.env.VITE_API_URL;
  return `${apiUrl}/api/users/${encodeURIComponent(userId)}/${action}`;
}

export async function getFollowStats(
  userId: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<FollowStats> {
  const response = await fetch(followUrl(userId, "follow-stats"), {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити підписки (${response.status}).`);
  }

  return response.json();
}

export async function setFollow(
  userId: string,
  accessToken: string,
  shouldFollow: boolean,
): Promise<void> {
  const response = await fetch(followUrl(userId, "follow"), {
    method: shouldFollow ? "POST" : "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!shouldFollow && response.status === 404) return;

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб змінити підписку.");
  }

  if (response.status === 400 && shouldFollow) {
    throw new Error("На власний профіль підписатися не можна.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося змінити підписку (${response.status}).`);
  }
}