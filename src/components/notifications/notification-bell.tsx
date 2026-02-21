"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { getUnreadNotifications, markNotificationAsRead, type Notification } from "@/actions/notifications";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    const list = await getUnreadNotifications();
    setNotifications(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(n: Notification) {
    await markNotificationAsRead(n.id);
    setNotifications((prev) => prev.filter((x) => x.id !== n.id));
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-primary transition-colors"
        aria-label="Notificações"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-80 max-w-[90vw] max-h-[400px] overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-50 py-2">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação nova</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markAsRead(n)}
                    className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <p className="font-medium text-foreground text-sm">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
