"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

/**
 * Wraps next-themes with our defaults:
 * - attribute="class" so we get `.light` / `.dark` on <html>
 * - defaultTheme="dark" (Hulabe identity)
 * - enableSystem so users can opt into system preference
 * - disableTransitionOnChange to avoid flicker during switch
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="hulabe-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
