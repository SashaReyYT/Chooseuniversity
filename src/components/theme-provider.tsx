"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode, ComponentPropsWithoutRef } from "react";

type ThemeProviderProps = ComponentPropsWithoutRef<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps & { children: ReactNode }) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}