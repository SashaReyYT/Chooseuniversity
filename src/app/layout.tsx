import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "./globals.css";
import "./fonts.css";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Unifind — Find the universities that actually fit you",
  description:
    "Unifind helps students discover university programmes, understand how well each one fits their profile, compare options, and build an informed shortlist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <head>
        {/*
          Material Symbols Outlined is used throughout the Unifind mockups
          (nav icons, chips, status glyphs). It isn't a next/font/google
          entry, so it's loaded the same way the reference mockups load it.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-md min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}
