"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary (spec section 58). Catches any unhandled
 * render error across the app. Users only ever see a generic Uzbek
 * message; the raw error/stack is logged to the console for
 * developers, never shown in the UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <html lang="uz">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </div>
          <div>
            <h1 className="text-lg font-medium">Xatolik yuz berdi</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Qayta urinib ko&apos;ring. Agar muammo davom etsa, sahifani
              yangilang.
            </p>
          </div>
          <Button onClick={() => reset()}>Qayta urinib ko&apos;rish</Button>
        </div>
      </body>
    </html>
  );
}
