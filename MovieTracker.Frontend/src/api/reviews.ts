export type MyReview = {
  rating: number;
  text: string | null;
};

export async function getMyReview(
  accessToken: string,
  movieId: number,
  signal?: AbortSignal,
): Promise<MyReview | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/api/movies/${movieId}/reviews/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  if (response.status === 404) return null;

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб переглянути свій відгук.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити відгук (${response.status}).`);
  }

  return response.json();
}

export async function saveMyReview(
  accessToken: string,
  movieId: number,
  review: MyReview,
): Promise<MyReview> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/api/movies/${movieId}/reviews/me`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rating: review.rating,
      text: review.text?.trim() || null,
    }),
  });

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб зберегти відгук.");
  }

  if (response.status === 409) {
    throw new Error("Не вдалося оновити відгук. Спробуй зберегти ще раз.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося зберегти відгук (${response.status}).`);
  }

  return response.json();
}

export async function deleteMyReview(
  accessToken: string,
  movieId: number,
): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/api/movies/${movieId}/reviews/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 404) return;

  if (response.status === 401) {
    throw new Error("Увійди знову, щоб видалити свій відгук.");
  }

  if (!response.ok) {
    throw new Error(`Не вдалося видалити відгук (${response.status}).`);
  }
}