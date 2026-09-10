"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App segment error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <div>
        <h2 className="text-lg font-medium">Xatolik yuz berdi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bu sahifani yuklashda muammo bo&apos;ldi. Qayta urinib ko&apos;ring.
        </p>
      </div>
      <Button onClick={() => reset()}>Qayta urinib ko&apos;rish</Button>
    </div>
  );
}
