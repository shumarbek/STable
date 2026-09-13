"use client";

import { useEffect, useState } from "react";
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
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const typeLabels: Record<string, string> = {
    all: "Barchasi",
    expense: "Chiqim",
    income: "Kirim",
    transfer: "O‘tkazma",
    loan: "Qarz",
    debt_repayment: "Qarz qaytarish",
    refund: "Qaytarish",
  };
  const sortLabels: Record<string, string> = {
    newest: "Eng yangi",
    oldest: "Eng eski",
    amount_desc: "Eng katta summa",
    amount_asc: "Eng kichik summa",
  };

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/transactions?${query}` : "/transactions", { scroll: false });
  }

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const timeout = window.setTimeout(() => setParam("search", search.trim() || undefined), 350);
    return () => window.clearTimeout(timeout);
    // URL parameters deliberately restart the comparison after navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchParams]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Izoh bo‘yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) => setParam("type", !v || v === "all" ? undefined : v)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue>{(value) => typeLabels[String(value)] ?? "Barchasi"}</SelectValue>
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
          <SelectValue>
            {(value) => value === "all"
              ? "Barcha hisoblar"
              : accounts.find((account) => account.id === value)?.name ?? "Barcha hisoblar"}
          </SelectValue>
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
          <SelectValue>
            {(value) => value === "all"
              ? "Barcha kategoriyalar"
              : categories.find((category) => category.id === value)?.name ?? "Barcha kategoriyalar"}
          </SelectValue>
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
          <SelectValue>{(value) => sortLabels[String(value)] ?? "Eng yangi"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Eng yangi</SelectItem>
          <SelectItem value="oldest">Eng eski</SelectItem>
          <SelectItem value="amount_desc">Eng katta summa</SelectItem>
          <SelectItem value="amount_asc">Eng kichik summa</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
