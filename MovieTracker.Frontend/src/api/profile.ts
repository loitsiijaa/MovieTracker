export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

export type MyProfile = PublicProfile & {
  email: string;
};

export type ProfileCollection = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  moviesCount: number;
};

export type UpdateCollectionData = {
  name: string;
  description: string | null;
  isPublic: boolean;
};

export type ProfileReview = {
  id: string;
  movieId: number;
  movieTitle: string;
  rating: number;
  text: string | null;
};

export type ProfileReviewsPage = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: ProfileReview[];
};

async function getJson<T>(
  path: string,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<T> {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${apiUrl}${path}`, {
    signal,
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб переглянути ці дані.");
  }

  if (response.status === 404) {
    throw new Error("Користувача не знайдено.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити дані (${response.status}).`);
  }

  return response.json();
}

function getCollectionError(response: Response) {
  if (response.status === 401) {
    return "Увійди знову, щоб змінити колекцію.";
  }

  if (response.status === 403 || response.status === 404) {
    return "Колекцію не знайдено або вона тобі не належить.";
  }

  return `Не вдалося зберегти зміни (${response.status}).`;
}

export function getMyProfile(accessToken: string, signal?: AbortSignal) {
  return getJson<MyProfile>("/api/users/me", signal, accessToken);
}

export function getMyCollections(accessToken: string, signal?: AbortSignal) {
  return getJson<ProfileCollection[]>(
    "/api/collections/me",
    signal,
    accessToken,
  );
}

export async function updateCollection(
  accessToken: string,
  collectionId: string,
  data: UpdateCollectionData,
): Promise<ProfileCollection> {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${apiUrl}/api/collections/${encodeURIComponent(collectionId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(getCollectionError(response));
  }

  return response.json();
}

export async function deleteCollection(
  accessToken: string,
  collectionId: string,
): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${apiUrl}/api/collections/${encodeURIComponent(collectionId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(getCollectionError(response));
  }
}

export function getPublicProfile(userId: string, signal?: AbortSignal) {
  return getJson<PublicProfile>(
    `/api/users/${encodeURIComponent(userId)}`,
    signal,
  );
}

export function getPublicCollections(userId: string, signal?: AbortSignal) {
  return getJson<ProfileCollection[]>(
    `/api/users/${encodeURIComponent(userId)}/collections`,
    signal,
  );
}

export function getProfileReviews(
  userId: string,
  page = 1,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ page: String(page) });

  return getJson<ProfileReviewsPage>(
    `/api/users/${encodeURIComponent(userId)}/reviews?${params}`,
    signal,
  );
}