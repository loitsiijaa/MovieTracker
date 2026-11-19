import { useEffect, useRef, useState } from "react";
import { getMyProfile, type MyProfile } from "../api/profile";
import "../styles/account-menu.css";

type AccountMenuProps = {
  accessToken: string;
  onOpenProfile: () => void;
  onLogout: () => void;
};

export default function AccountMenu({
  accessToken,
  onOpenProfile,
  onLogout,
}: AccountMenuProps) {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [brokenAvatar, setBrokenAvatar] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    getMyProfile(accessToken, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setProfile(data);
          setBrokenAvatar(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setProfile(null);
      });

    return () => controller.abort();
  }, [accessToken]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const initial = profile?.displayName.trim().charAt(0).toLocaleUpperCase("uk") || "•";
  const avatarUrl = profile?.avatarUrl;

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        className="account-menu__trigger account-link"
        type="button"
        aria-label="Меню акаунта"
        aria-expanded={isOpen}
        aria-controls="account-menu-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        {avatarUrl?.startsWith("https://") && !brokenAvatar ? (
          <img
            src={avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBrokenAvatar(true)}
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </button>

      <div id="account-menu-panel" className="account-menu__panel" hidden={!isOpen}>
        <p className="account-menu__name">{profile?.displayName || "Мій акаунт"}</p>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            onOpenProfile();
          }}
        >
          Мій профіль
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            onLogout();
          }}
        >
          Вийти
        </button>
      </div>
    </div>
  );
}