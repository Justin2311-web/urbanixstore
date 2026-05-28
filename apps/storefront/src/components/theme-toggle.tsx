"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="size-9 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:bg-secondary/50"
      onClick={toggleTheme}
      size="icon"
      type="button"
      variant="ghost"
    >
      {theme === "light" ? (
        <Moon className="size-5 text-foreground/70" />
      ) : (
        <Sun className="size-5 text-accent" />
      )}
    </Button>
  );
}
