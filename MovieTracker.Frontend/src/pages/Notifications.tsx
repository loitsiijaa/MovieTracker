import { useEffect, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationsPage,
} from "../api/notifications";

type NotificationsProps = {
  accessToken: string;
  onBack: () => void;
  onOpenProfile: (userId: string) => void;
};

type PendingAction =
  | { kind: "one"; id: string }
  | { kind: "all" };

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function Notifications({
  accessToken,
  onBack,
  onOpenProfile,
}: NotificationsProps) {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [data, setData] = useState<NotificationsPage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadNotifications() {
      try {
        const result = await getNotifications(
          accessToken,
          page,
          unreadOnly,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        const lastPage = Math.max(1, result.totalPages);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setData(result);
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Не вдалося завантажити сповіщення.",
        );
      }
    }

    void loadNotifications();
    return () => controller.abort();
  }, [accessToken, page, unreadOnly, refreshCount]);

  function clearResults() {
    setData(null);
    setLoadError("");
    setActionError("");
    setMessage("");
  }

  function goToPage(nextPage: number) {
    clearResults();
    setPage(nextPage);
  }

  function changeFilter(nextUnreadOnly: boolean) {
    if (nextUnreadOnly === unreadOnly) return;

    clearResults();
    setUnreadOnly(nextUnreadOnly);
    setPage(1);
  }

  async function handleMarkRead(action: PendingAction) {
    if (pending) return;

    setPending(action);
    setActionError("");
    setMessage("");

    try {
      if (action.kind === "all") {
        await markAllNotificationsRead(accessToken);
        setMessage("Усі сповіщення позначено прочитаними.");
      } else {
        await markNotificationRead(accessToken, action.id);
        setMessage("Сповіщення позначено прочитаним.");
      }

      setData(null);
      setLoadError("");
      setRefreshCount((count) => count + 1);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Не вдалося оновити сповіщення.",
      );
    } finally {
      setPending(null);
    }
  }

  const totalPages = Math.max(1, data?.totalPages ?? 1);

  return (
    <main>
      <button type="button" onClick={onBack}>← До каталогу</button>
      <h1>Сповіщення</h1>

      <p>
        <label htmlFor="notifications-filter">Показати</label>{" "}
        <select
          id="notifications-filter"
          value={unreadOnly ? "unread" : "all"}
          disabled={pending !== null}
          onChange={(event) => changeFilter(event.target.value === "unread")}
        >
          <option value="all">Усі сповіщення</option>
          <option value="unread">Непрочитані</option>
        </select>{" "}
        <button
          type="button"
          disabled={pending !== null || !data?.totalResults}
          onClick={() => void handleMarkRead({ kind: "all" })}
        >
          {pending?.kind === "all" ? "Оновлюємо…" : "Прочитати всі"}
        </button>
      </p>

      {message && <p role="status">{message}</p>}
      {loadError && <p role="alert">{loadError}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      {!loadError && !data && <p role="status">Завантажуємо сповіщення…</p>}

      {data?.items.length === 0 && (
        <p>
          {unreadOnly
            ? "Непрочитаних сповіщень немає."
            : "Сповіщень поки немає."}
        </p>
      )}

      {data && data.items.length > 0 && (
        <ul className="movie-reviews__list">
          {data.items.map((notification) => {
            const actorId = notification.actorId;
            const isUpdating =
              pending?.kind === "one" && pending.id === notification.id;

            return (
              <li key={notification.id} className="movie-reviews__card">
                {!notification.isRead && (
                  <strong className="movie-reviews__rating">Нове</strong>
                )}
                <p>{notification.text}</p>
                <time dateTime={notification.createdAt}>
                  {dateFormatter.format(new Date(notification.createdAt))}
                </time>

                {(!notification.isRead || actorId) && (
                  <p>
                    {!notification.isRead && (
                      <button
                        type="button"
                        disabled={pending !== null}
                        onClick={() =>
                          void handleMarkRead({ kind: "one", id: notification.id })
                        }
                      >
                        {isUpdating ? "Оновлюємо…" : "Позначити прочитаним"}
                      </button>
                    )}
                    {actorId && (
                      <>
                        {" "}
                        <button type="button" onClick={() => onOpenProfile(actorId)}>
                          Відкрити профіль
                        </button>
                      </>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(totalPages > 1 || page > 1) && (
        <nav aria-label="Сторінки сповіщень">
          <button
            type="button"
            disabled={page <= 1 || pending !== null}
            onClick={() => goToPage(page - 1)}
          >
            Назад
          </button>{" "}
          <span>Сторінка {page}</span>{" "}
          <button
            type="button"
            disabled={!data || page >= totalPages || pending !== null}
            onClick={() => goToPage(page + 1)}
          >
            Далі
          </button>
        </nav>
      )}
    </main>
  );
}