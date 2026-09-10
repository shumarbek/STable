"use client";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/features/auth/actions";

export function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <Button type="submit" variant="outline" className="w-full h-11 gap-2">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.41 3.62v3.01h3.89c2.28-2.1 3.57-5.2 3.57-8.81z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.94-2.92l-3.89-3.01c-1.08.73-2.46 1.16-4.05 1.16-3.12 0-5.76-2.1-6.7-4.93H1.28v3.1C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.3 14.3c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3V6.6H1.28C.46 8.24 0 10.06 0 12s.46 3.76 1.28 5.4l4.02-3.1z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.6l4.02 3.1c.94-2.83 3.58-4.93 6.7-4.93z"
          />
        </svg>
        Google orqali davom etish
      </Button>
    </form>
  );
}
