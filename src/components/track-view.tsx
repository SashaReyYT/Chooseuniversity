"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/**
 * Fire-and-forget page-view event for Server Component pages — renders
 * nothing, fires once per mounted id.
 */
export function TrackView({
  event,
  props,
}: {
  event: string;
  props?: Record<string, unknown>;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}