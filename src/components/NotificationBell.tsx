"use client";

import { Bell, BellOff } from "lucide-react";
import { useNotification } from "@/hooks/useNotification";

export function NotificationBell() {
  const { permission, requestPermission } = useNotification();

  // Don't render on unsupported browsers
  if (permission === "unsupported") return null;

  async function handleClick() {
    if (permission === "default") {
      await requestPermission();
    }
  }

  if (permission === "denied") {
    return (
      <button
        disabled
        title="Notifications blocked — enable in browser settings"
        className="rounded-lg p-1.5 text-ink-300 cursor-not-allowed"
      >
        <BellOff className="h-4 w-4" />
      </button>
    );
  }

  if (permission === "granted") {
    return (
      <button
        disabled
        title="Notifications enabled"
        className="rounded-lg p-1.5 text-parchment-700"
      >
        <Bell className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title="Enable notifications for analysis results"
      className="rounded-lg p-1.5 text-ink-400 transition-colors hover:text-ink-700"
    >
      <Bell className="h-4 w-4" />
    </button>
  );
}
