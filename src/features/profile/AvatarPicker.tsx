"use client";

import { UserRound } from "lucide-react";
import { cn } from "cn";

export function AvatarPicker({
  gender,
  value,
  onChange,
  avatars,
}: {
  gender: "male" | "female";
  value: string;
  onChange: (value: string) => void;
  avatars: { male: string[]; female: string[] };
}) {
  const options = avatars[gender];

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Profil rasmi</p>
      {options.length ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {options.map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => onChange(source)}
              className={cn(
                "aspect-square overflow-hidden rounded-full border-2 bg-muted transition hover:scale-105",
                value === source ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              )}
              aria-label="Profil rasmini tanlash"
            >
              {/* User-managed local assets are served from /public. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source} alt="Profil rasmi" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
          <UserRound className="size-8 shrink-0" />
          <span>
            {gender === "male" ? "Erkaklar" : "Ayollar"} uchun rasmlar hali joylanmagan.
          </span>
        </div>
      )}
    </div>
  );
}
