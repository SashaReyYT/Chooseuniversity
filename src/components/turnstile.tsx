"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

interface TurnstileProps {
  /** Called with the token once solved; call clearToken() on form reset. */
  onToken: (token: string | null) => void;
  siteKey: string;
}

/**
 * Cloudflare Turnstile widget. Renders nothing when `siteKey` is empty so
 * local dev and self-hosted previews work without registration.
 */
export function Turnstile({ onToken, siteKey }: TurnstileProps) {
  const t = useTranslations("Auth");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current || widgetIdRef.current) return;

    const render = () => {
      if (!containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return (
    <div className="space-y-1">
      <div ref={containerRef} />
      <p className="font-body-xs text-body-xs text-on-surface-variant">
        {t("turnstileHint")}
      </p>
    </div>
  );
}