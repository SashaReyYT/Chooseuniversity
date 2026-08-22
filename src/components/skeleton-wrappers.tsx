"use client";

import { Suspense } from "react";
import {
  SkeletonProgrammeCard,
  SkeletonCard,
  SkeletonUniversityCard,
  SkeletonDiscoverFilters,
} from "@/components/skeleton";

interface ProgrammeCardSkeletonProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProgrammeCardSkeleton({ children, fallback }: ProgrammeCardSkeletonProps) {
  return (
    <Suspense fallback={fallback ?? <SkeletonProgrammeCard />}>
      {children}
    </Suspense>
  );
}

export function DiscoverSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonDiscoverFilters />
      <SkeletonProgrammeCard />
      <SkeletonProgrammeCard />
      <SkeletonProgrammeCard />
      <SkeletonProgrammeCard />
      <SkeletonProgrammeCard />
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function ProgrammeSkeleton() {
  return <SkeletonProgrammeCard />;
}

export function UniversitySkeleton() {
  return <SkeletonUniversityCard />;
}