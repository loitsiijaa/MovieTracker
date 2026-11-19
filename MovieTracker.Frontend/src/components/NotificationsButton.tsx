import { useEffect, useState } from "react";
import { getNotifications } from "../api/notifications";

type NotificationsButtonProps = {
  accessToken: string;
  onClick: () => void;
};

export default function NotificationsButton({
  accessToken,
  onClick,
}: NotificationsButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUnreadCount() {
      try {
        const result = await getNotifications(
          accessToken,
          1,
          true,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setUnreadCount(result.totalResults);
        }
      } catch {
        if (!controller.signal.aborted) {
          setUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();

    return () => controller.abort();
  }, [accessToken]);

  return (
    <button className="account-link" type="button" onClick={onClick}>
      Сповіщення{unreadCount > 0 ? ` (${unreadCount})` : ""}
    </button>
  );
}