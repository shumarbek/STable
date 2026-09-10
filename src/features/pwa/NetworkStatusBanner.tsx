"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Shows a persistent banner when the browser goes offline, per spec
 * section 57 (network resilience UX). Financial mutations still fail
 * fast with a clear error while offline — this banner just gives the
 * user an immediate, ambient signal instead of surprising errors.
 */
export function NetworkStatusBanner() {
  // Always start as "online" on both the server render and the
  // client's first hydration pass — this guarantees the initial
  // markup matches exactly (no hydration mismatch). The real
  // connection state is then read and kept in sync inside the effect
  // below, which only runs after hydration completes. This means the
  // banner can only ever appear slightly after mount, never during
  // the initial paint, avoiding server/client HTML divergence.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a real browser API value after mount is required here; there is no lazy-initializer equivalent that stays hydration-safe.
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-center text-xs font-medium text-warning-foreground">
      <WifiOff className="size-3.5" />
      Internet aloqasi yo&apos;q. Ba&apos;zi amallar ishlamasligi mumkin.
    </div>
  );
}
