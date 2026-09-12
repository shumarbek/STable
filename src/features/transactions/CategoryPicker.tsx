"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CategoryNode } from "@/features/categories/queries";
import { CategoryIcon } from "@/features/categories/CategoryIcon";

/**
 * Hierarchical category picker (spec section 102): a searchable popover
 * showing parent categories with their children indented underneath,
 * instead of one long flat dropdown.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: CategoryNode[];
  value: string | null;
  onChange: (categoryId: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  function findSelectedLabel(): string | null {
    for (const parent of categories) {
      if (parent.id === value) return parent.name;
      for (const child of parent.children) {
        if (child.id === value) return child.name;
      }
    }
    return null;
  }

  const selectedLabel = findSelectedLabel();

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories
      .map((parent) => {
        const parentMatches = parent.name.toLowerCase().includes(q);
        const matchingChildren = parent.children.filter((c) =>
          c.name.toLowerCase().includes(q)
        );
        if (parentMatches) return parent;
        if (matchingChildren.length > 0) {
          return { ...parent, children: matchingChildren };
        }
        return null;
      })
      .filter((p): p is CategoryNode => p !== null);
  }, [categories, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            <span className={cn(!selectedLabel && "text-muted-foreground")}>
              {selectedLabel ?? "Kategoriyani tanlang"}
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="flex flex-col p-1">
            {filtered.map((parent) => (
              <div key={parent.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(parent.id, parent.name);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium hover:bg-muted",
                    value === parent.id && "bg-primary/10 text-primary"
                  )}
                >
                  <CategoryIcon icon={parent.icon} className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{parent.name}</span>
                  {value === parent.id && <Check className="size-4" />}
                </button>
                {parent.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      onChange(child.id, child.name);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 pl-8 text-left text-sm hover:bg-muted",
                      value === child.id && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="flex-1 truncate">{child.name}</span>
                    {value === child.id && <Check className="size-4" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                Hech narsa topilmadi
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
