"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode, ComponentPropsWithoutRef } from "react";

export function ThemeProvider({ children, storageKey, ...props }: { children: ReactNode; storageKey?: string } & ComponentPropsWithoutRef<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}