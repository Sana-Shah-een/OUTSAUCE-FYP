"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed top-20 right-6 z-50">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="rounded-full w-10 h-10 bg-background/30 backdrop-blur-md border border-white/10 shadow-lg dark:shadow-black/20 hover:bg-background/50 transition-colors"
        >
          {isDark ? (
            <Moon className="h-[1.2rem] w-[1.2rem] text-primary transition-all" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem] text-brand-red transition-all" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </motion.div>
    </div>
  );
}
