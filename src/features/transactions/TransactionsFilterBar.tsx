"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/features/categories/CategoryIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserAccount, Category } from "@/types/database";

export function TransactionsFilterBar({
  accounts,
  categories,
}: {
  accounts: UserAccount[];
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/transactions?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Izoh bo'yicha qidirish..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => setParam("search", e.target.value || undefined)}
          className="pl-9"
        />
      </div>

      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) => setParam("type", !v || v === "all" ? undefined : v)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Turi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barchasi</SelectItem>
          <SelectItem value="expense">Chiqim</SelectItem>
          <SelectItem value="income">Kirim</SelectItem>
          <SelectItem value="transfer">O&apos;tkazma</SelectItem>
          <SelectItem value="loan">Qarz</SelectItem>
          <SelectItem value="debt_repayment">Qarz qaytarish</SelectItem>
          <SelectItem value="refund">Qaytarish</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("accountId") ?? "all"}
        onValueChange={(v) => setParam("accountId", !v || v === "all" ? undefined : v)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Hisob" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha hisoblar</SelectItem>
          {accounts.map((acc) => (
            <SelectItem key={acc.id} value={acc.id}>
              {acc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("categoryId") ?? "all"}
        onValueChange={(v) => setParam("categoryId", !v || v === "all" ? undefined : v)}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Kategoriya" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha kategoriyalar</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-2">
                <CategoryIcon icon={cat.icon} className="size-4" />
                {cat.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sort") ?? "newest"}
        onValueChange={(v) => setParam("sort", v ?? undefined)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Saralash" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Yangi birinchi</SelectItem>
          <SelectItem value="oldest">Eski birinchi</SelectItem>
          <SelectItem value="amount_desc">Yuqori summa</SelectItem>
          <SelectItem value="amount_asc">Past summa</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
