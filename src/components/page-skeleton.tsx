import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { cn } from "@/lib/utils.ts";

function SkeletonCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/60", className)}>
      {children}
    </div>
  );
}

function InfoRowsSkeleton({ rows }: { rows: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex justify-between items-center gap-4 py-2.5 border-b border-border/30 last:border-0"
        >
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-32 max-w-[45%]" />
        </div>
      ))}
    </div>
  );
}

function DetailCardSkeleton({
  titleWidth,
  rows,
}: {
  titleWidth: string;
  rows: number;
}) {
  return (
    <SkeletonCard className="p-3 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className={cn("h-4", titleWidth)} />
      </div>
      <InfoRowsSkeleton rows={rows} />
    </SkeletonCard>
  );
}

export function AdminBookingDetailSkeleton() {
  return (
    <div className="px-2.5 py-3 sm:p-6 max-w-6xl pb-16 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      <SkeletonCard className="p-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-[4.5rem] w-20 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2 pt-0.5">
            <Skeleton className="h-5 w-52 max-w-full" />
            <Skeleton className="h-3.5 w-40 max-w-[70%]" />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </SkeletonCard>

      <div className="flex items-center gap-2 px-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            {i < 4 && <Skeleton className="h-px flex-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <DetailCardSkeleton titleWidth="w-40" rows={3} />
        <DetailCardSkeleton titleWidth="w-32" rows={6} />
        <DetailCardSkeleton titleWidth="w-24" rows={5} />
      </div>

      <DetailCardSkeleton titleWidth="w-36" rows={2} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

export function CustomerBookingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-2.5 sm:px-6 py-5 sm:py-8">
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="space-y-4">
        <SkeletonCard className="p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-[4.5rem] w-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48 max-w-full" />
              <Skeleton className="h-3.5 w-36" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </SkeletonCard>
        <div className="flex items-center gap-2 px-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0 flex-1">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              {i < 3 && <Skeleton className="h-px flex-1" />}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailCardSkeleton titleWidth="w-32" rows={6} />
          <div className="space-y-3">
            <DetailCardSkeleton titleWidth="w-24" rows={4} />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="min-w-[100px]">Booking ID</TableHead>
            <TableHead className="min-w-[140px] hidden sm:table-cell">Customer</TableHead>
            <TableHead className="min-w-[130px] hidden md:table-cell">Vehicle</TableHead>
            <TableHead className="min-w-[150px]">Pickup</TableHead>
            <TableHead className="min-w-[150px] hidden lg:table-cell">Drop-off</TableHead>
            <TableHead className="min-w-[90px]">Status</TableHead>
            <TableHead className="min-w-[90px] hidden md:table-cell">Payment</TableHead>
            <TableHead className="min-w-[80px]">Total</TableHead>
            <TableHead className="min-w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="pointer-events-none">
              <TableCell>
                <Skeleton className="h-3.5 w-[4.5rem]" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-3.5 w-28 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-3.5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-28 mb-1.5" />
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-3.5 w-28 mb-1.5" />
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-14" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminShellSkeleton() {
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/50 bg-card/40 p-4 space-y-4">
        <Skeleton className="h-8 w-28" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="mt-auto space-y-2 pt-4 border-t border-border/50">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </aside>
      <div className="flex-1 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16 hidden sm:block" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
