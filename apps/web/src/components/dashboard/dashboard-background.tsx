"use client";

import { useTheme } from "next-themes";
import { EtherealDust } from "@/components/EtherealDust";
import { useEffect, useState } from "react";

export function DashboardBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <EtherealDust isLightMode={resolvedTheme === "light"} />;
}
