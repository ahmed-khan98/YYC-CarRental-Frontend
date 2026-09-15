import type { FileUploadProgress } from "@/api/upload.api.ts";
import { cn } from "@/lib/utils.ts";

export function overallUploadPercent(progress: FileUploadProgress) {
  const count = Math.max(1, progress.fileCount);
  const index = Math.min(count, Math.max(1, progress.fileIndex));
  return Math.round(((index - 1) * 100 + Math.max(0, Math.min(100, progress.percent))) / count);
}

export function uploadProgressLabel(base: string, progress: FileUploadProgress) {
  return progress.fileCount > 1 ? `${base} ${progress.fileIndex} of ${progress.fileCount}` : base;
}

export function UploadProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function UploadProgressStatus({
  label,
  percent,
  className,
}: {
  label: string;
  percent?: number | null;
  className?: string;
}) {
  const showBar = percent != null;
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="min-w-0 font-medium leading-snug">{label}</p>
        {showBar && (
          <span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(percent)}%</span>
        )}
      </div>
      {showBar && <UploadProgressBar percent={percent} />}
    </div>
  );
}
