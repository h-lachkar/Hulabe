"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import * as React from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  /**
   * - "auto" (default): picks based on active theme (dark logo on dark bg, light logo on light bg)
   * - "dark": dark-themed logo (lime/white on transparent — for dark backgrounds)
   * - "light": light-themed logo (dark on transparent — for light backgrounds)
   * - "icon": square icon only
   */
  variant?: "auto" | "dark" | "light" | "icon";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function Logo({ variant = "auto", className, width, height, priority }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (variant === "icon") {
    return (
      <Image
        src="/icon.svg"
        alt="Hulabe"
        width={width ?? 32}
        height={height ?? 32}
        className={cn("h-8 w-8", className)}
        priority={priority}
      />
    );
  }

  // Resolve which file to load. Until mounted, default to dark to match SSR.
  const resolved =
    variant === "auto"
      ? !mounted || resolvedTheme === "dark"
        ? "dark"
        : "light"
      : variant;

  const src = resolved === "dark" ? "/logo-dark.svg" : "/logo-light.svg";

  return (
    <Image
      src={src}
      alt="Hulabe"
      width={width ?? 124}
      height={height ?? 32}
      className={cn("h-8 w-auto", className)}
      priority={priority}
    />
  );
}
