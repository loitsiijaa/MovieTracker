import { useEffect, useState } from "react";
import { getFollowStats, setFollow, type FollowStats } from "../api/follows";
import { getMyProfile } from "../api/profile";

type FollowPanelProps = {
  userId: string;
  accessToken?: string;
};

type FollowData = {
  stats: FollowStats;
  viewerId: string | null;
};

export default function FollowPanel({
  userId,
  accessToken,
}: FollowPanelProps) {
  const [data, setData] = useState<FollowData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFollowData() {
      try {
        const [stats, viewer] = await Promise.all([
          getFollowStats(userId, accessToken, controller.signal),
          accessToken ? getMyProfile(accessToken, controller.signal) : null,
        ]);

        if (!controller.signal.aborted) {
          setData({ stats, viewerId: viewer?.id ?? null });
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error ? error.message : "Не вдалося завантажити підписки.",
        );
      }
    }

    void loadFollowData();
    return () => controller.abort();
  }, [userId, accessToken]);

  async function handleToggleFollow() {
    if (!accessToken || !data?.viewerId || data.viewerId === userId || isSaving) {
      return;
    }

    const shouldFollow = !data.stats.isFollowedByMe;
    setIsSaving(true);
    setActionError("");

    try {
      await setFollow(userId, accessToken, shouldFollow);

      setData((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                isFollowedByMe: shouldFollow,
                followersCount: Math.max(
                  0,
                  current.stats.followersCount + (shouldFollow ? 1 : -1),
                ),
              },
            }
          : current,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не вдалося змінити підписку.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loadError) return <p role="alert">{loadError}</p>;
  if (!data) return <p role="status">Завантажуємо підписки…</p>;

  return (
    <div>
      <p>
        Підписники: <strong>{data.stats.followersCount}</strong>
        {" · "}
        Підписки: <strong>{data.stats.followingCount}</strong>
      </p>

      {accessToken && data.viewerId && data.viewerId !== userId && (
        <button type="button" onClick={handleToggleFollow} disabled={isSaving}>
          {isSaving
            ? "Оновлюємо…"
            : data.stats.isFollowedByMe
              ? "Відписатися"
              : "Підписатися"}
        </button>
      )}

      {actionError && <p role="alert">{actionError}</p>}
    </div>
  );
}