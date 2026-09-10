"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no-op, user can still select text manually.
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-sm font-medium tracking-wider">{id}</span>
      <Button variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="ID nusxalash">
        {copied ? <Check className="size-3.5 text-income" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}
