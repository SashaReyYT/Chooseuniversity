"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface MatchScoreChange {
  programmeId: string;
  programmeName: string;
  universityName: string;
  beforeScore: number;
  afterScore: number;
  change: number;
  direction: "up" | "down" | "same";
}

interface UseMatchChangesReturn {
  changes: MatchScoreChange[];
  isLoading: boolean;
  error: string | null;
  checkForChanges: () => Promise<void>;
  dismissChange: (programmeId: string) => void;
  dismissAll: () => void;
}

/**
 * Hook to track match score changes after profile updates.
 * Stores previous scores in sessionStorage and compares on next visit.
 */
export function useMatchChanges(): UseMatchChangesReturn {
  const [changes, setChanges] = useState<MatchScoreChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const STORAGE_KEY = "unifind_prev_match_scores";

  const checkForChanges = useCallback(async () => {
    const supabase = createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get previous scores from sessionStorage
      const stored = sessionStorage.getItem(STORAGE_KEY);
      let prevScores: Record<string, number> = {};
      if (stored) {
        try {
          prevScores = JSON.parse(stored);
        } catch {
          prevScores = {};
        }
      }

      // Fetch current scores
      const response = await fetch("/api/match/scores");
      if (!response.ok) throw new Error("Failed to fetch current match scores");
      
      const currentData = await response.json();
      const currentScores: Record<string, number> = currentData.scores || {};

      // Compare scores
      const allIds = new Set([...Object.keys(prevScores), ...Object.keys(currentScores)]);
      const changes: MatchScoreChange[] = [];

      for (const id of allIds) {
        const beforeScore = prevScores[id] ?? 0;
        const afterScore = currentScores[id] ?? 0;
        const change = afterScore - beforeScore;
        
        if (Math.abs(change) > 0) {
          changes.push({
            programmeId: id,
            programmeName: currentData.programmes?.[id]?.name || "Unknown",
            universityName: currentData.programmes?.[id]?.university || "Unknown",
            beforeScore,
            afterScore,
            change,
            direction: change > 0 ? "up" : "down",
          });
        }
      }

      // Sort by absolute change descending
      changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      
      setChanges(changes);

      // Update sessionStorage with new current scores
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentScores));
      sessionStorage.removeItem("unifind_pending_match_comparison");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check for changes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load previous scores from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          JSON.parse(stored); // Just validate JSON
          // Check if we have a pending comparison from a recent profile update
          const pendingComparison = sessionStorage.getItem("unifind_pending_match_comparison");
          if (pendingComparison === "true") {
            // We just updated profile, need to fetch new scores and compare
            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => {
              checkForChanges();
            }, 0);
          }
        } catch {
          // Invalid stored data, clear it
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [checkForChanges]);

  const dismissChange = useCallback((programmeId: string) => {
    setChanges((prev) => prev.filter((c) => c.programmeId !== programmeId));
  }, []);

  const dismissAll = useCallback(() => {
    setChanges([]);
  }, []);

  return {
    changes,
    isLoading,
    error,
    checkForChanges,
    dismissChange,
    dismissAll,
  };
}

/**
 * Call this before updating the profile to capture current match scores.
 * This enables the "what changed" feature after the update.
 */
export async function captureMatchScoresBeforeUpdate(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch("/api/match/scores");
    if (!response.ok) return;
    
    const data = await response.json();
    const scores = data.scores || {};
    sessionStorage.setItem("unifind_prev_match_scores", JSON.stringify(scores));
    sessionStorage.setItem("unifind_pending_match_comparison", "true");
  } catch {
    // Silently fail - this is an enhancement feature
  }
}

/**
 * Call this after profile update to trigger comparison on next page load.
 */
export async function triggerMatchComparison(): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    const response = await fetch("/api/match/scores");
    if (!response.ok) return;
    
    const data = await response.json();
    const scores = data.scores || {};
    sessionStorage.setItem("unifind_prev_match_scores", JSON.stringify(scores));
  } catch {
    // Silently fail
  }
}