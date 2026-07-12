"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <Skeleton className="h-4 w-20 bg-zinc-800" />
          <Skeleton className="h-4 w-16 bg-zinc-800" />
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-4 w-16 bg-zinc-800" />
          <Skeleton className="h-4 w-20 bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32 bg-zinc-800" />
              <Skeleton className="h-3 w-48 bg-zinc-800" />
              <Skeleton className="h-2 w-full bg-zinc-800" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 bg-zinc-800" />
                <Skeleton className="h-6 w-20 bg-zinc-800" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-3 bg-zinc-800" />
            <Skeleton className="h-8 w-32 mb-2 bg-zinc-800" />
            <Skeleton className="h-3 w-16 bg-zinc-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="h-4 w-64 bg-zinc-800" />
      </div>
      <StatsSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full bg-zinc-800" />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full bg-zinc-800" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
