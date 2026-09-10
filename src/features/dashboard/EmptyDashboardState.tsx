import Link from "next/link";
import { PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyDashboardState({ fullName }: { fullName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PiggyBank className="size-8" />
      </div>
      <div>
        <h2 className="text-lg font-medium">
          {fullName ? `Salom, ${fullName}!` : "Xush kelibsiz!"}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Hali hech qanday xarajat yo&apos;q. Birinchi xarajatingizni kiriting va
          moliyaviy nazoratni boshlang.
        </p>
      </div>
      <Button
        className="gap-2"
        render={
          <Link href="/transactions/new">
            <Plus className="size-4" />
            Xarajat qo&apos;shish
          </Link>
        }
      />
    </div>
  );
}
