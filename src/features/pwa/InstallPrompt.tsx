"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shows a lightweight install banner when the browser fires
 * `beforeinstallprompt` (Chrome/Edge/Android). iOS Safari doesn't
 * support this event — users there install via the native
 * "Add to Home Screen" share-sheet action instead, so we don't show
 * anything unsupported there.
 */
export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredEvent || dismissed) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-40 flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg md:bottom-4 md:left-auto md:right-4 md:w-80">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Download className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">STable-ni o&apos;rnating</p>
          <p className="text-xs text-muted-foreground">Tezroq kirish uchun</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={async () => {
            await deferredEvent.prompt();
            setDeferredEvent(null);
          }}
        >
          O&apos;rnatish
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setDismissed(true)}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
