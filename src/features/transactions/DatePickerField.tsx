"use client";

import { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTrustedNow, toDateOnlyInTimeZone } from "@/lib/time/serverTime";

/**
 * Date picker restricted to today-and-earlier (spec section 10). "Today"
 * is resolved from a trusted server time source, not the browser clock,
 * so a user with a manually skewed local clock still can't pick a
 * future date in the UI. The database independently rejects future
 * dates regardless (see enforce_no_future_transaction_date trigger).
 */
export function DatePickerField({
  value,
  onChange,
  timezone = "Asia/Tashkent",
}: {
  value: string;
  onChange: (isoDate: string) => void;
  timezone?: string;
}) {
  const [open, setOpen] = useState(false);
  const [todayIso, setTodayIso] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTrustedNow().then((now) => {
      if (!cancelled) setTodayIso(toDateOnlyInTimeZone(now, timezone));
    });
    return () => {
      cancelled = true;
    };
  }, [timezone]);

  const todayDate = todayIso ? new Date(`${todayIso}T00:00:00`) : new Date();
  const selectedDate = value ? new Date(`${value}T00:00:00`) : todayDate;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start gap-2 font-normal")}
          >
            <CalendarIcon className="size-4" />
            {selectedDate.toLocaleDateString("uz-UZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          disabled={{ after: todayDate }}
          onSelect={(date) => {
            if (!date) return;
            const y = date.getFullYear();
            const m = (date.getMonth() + 1).toString().padStart(2, "0");
            const d = date.getDate().toString().padStart(2, "0");
            onChange(`${y}-${m}-${d}`);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
