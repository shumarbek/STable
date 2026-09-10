"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/calculations/money";
import { accountTypeLabels } from "@/lib/validators/account";
import { deactivateAccount } from "@/features/accounts/actions";
import type { UserAccount } from "@/types/database";

export function AccountsList({ accounts }: { accounts: UserAccount[] }) {
  const [isPending, startTransition] = useTransition();

  if (accounts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Hali hisob yaratilmagan.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {accounts.map((acc) => (
        <div
          key={acc.id}
          className="flex items-center justify-between rounded-lg px-2 py-2.5"
        >
          <div>
            <p className="text-sm font-medium">{acc.name}</p>
            <p className="text-xs text-muted-foreground">
              {accountTypeLabels[acc.type]} • {formatMoney(acc.balance, acc.currency)}
              {!acc.is_active && " • Faol emas"}
            </p>
          </div>
          {acc.is_active && (
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deactivateAccount(acc.id);
                  if ("error" in result) toast.error(result.error);
                })
              }
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
