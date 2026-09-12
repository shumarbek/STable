"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BarChart3, ChartPie, ReceiptText } from "lucide-react";
import { cn } from "cn";

type SplashState = "yopiq" | "ochiq" | "yopilmoqda";

export function MobileSplashScreen() {
  const [state, setState] = useState<SplashState>("yopiq");

  useEffect(() => {
    if (window.innerWidth >= 1024) return;

    const key = "stable-mobil-kirish-ekrani-v1";
    if (window.sessionStorage.getItem(key)) return;

    window.sessionStorage.setItem(key, "ko‘rsatildi");
    const openTimer = window.setTimeout(() => setState("ochiq"), 0);

    const fadeTimer = window.setTimeout(() => setState("yopilmoqda"), 1850);
    const closeTimer = window.setTimeout(() => setState("yopiq"), 2250);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(closeTimer);
      window.clearTimeout(openTimer);
    };
  }, []);

  if (state === "yopiq") return null;

  return (
    <div
      role="status"
      aria-label="STable yuklanmoqda"
      className={cn(
        "stable-splash fixed inset-0 z-[100] flex min-h-[100dvh] flex-col items-center justify-between px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] text-white lg:hidden",
        state === "yopilmoqda" && "stable-splash--closing"
      )}
    >
      <div className="stable-splash-orb stable-splash-orb--top" aria-hidden="true" />
      <div className="stable-splash-orb stable-splash-orb--side" aria-hidden="true" />
      <div className="stable-splash-wave stable-splash-wave--one" aria-hidden="true" />
      <div className="stable-splash-wave stable-splash-wave--two" aria-hidden="true" />

      <div aria-hidden="true" />

      <div className="stable-splash-content relative z-10 flex w-full flex-col items-center text-center">
        <Image
          src="/apple-touch-icon.png"
          alt="STable belgisi"
          width={160}
          height={160}
          priority
          sizes="(max-width: 640px) 128px, 160px"
          className="size-32 rounded-[2rem] object-cover shadow-[0_0_3rem_rgba(51,153,255,0.38)] sm:size-40"
        />
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">STable</h1>
        <p className="mt-2 max-w-72 text-base leading-relaxed text-blue-100/75 sm:text-lg">
          Shaxsiy moliyaviy nazorat platformasi
        </p>

        <div className="mt-10 h-1.5 w-44 overflow-hidden rounded-full bg-blue-950 ring-1 ring-white/5">
          <div className="stable-splash-progress h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
        </div>
        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.42em] text-blue-200/65">
          Aqlli nazorat · Yaxshi hayot
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 text-blue-200/60">
        <div className="flex items-center gap-5">
          <ReceiptText className="size-6" />
          <span className="h-7 w-px bg-blue-300/25" />
          <ChartPie className="size-6" />
          <span className="h-7 w-px bg-blue-300/25" />
          <BarChart3 className="size-6" />
        </div>
        <p className="text-xs tracking-wide">Nazorat · Reja · Yaxshiroq kelajak</p>
      </div>
    </div>
  );
}
