"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // This is the standard next-themes hydration-safe pattern: the
  // server always renders `disabled` (theme is unknown until after
  // hydration), then flips to the real value once mounted. This
  // genuinely requires a setState-on-mount effect — there's no lazy
  // initializer equivalent, since the value must change *after* the
  // first paint to avoid a server/client markup mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Switch disabled />;
  }

  return (
    <Switch
      checked={theme === "dark"}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      aria-label="Tungi rejimni yoqish"
    />
  );
}
