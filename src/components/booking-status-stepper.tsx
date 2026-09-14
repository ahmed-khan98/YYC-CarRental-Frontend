import { CircleCheckBig } from "lucide-react";
import type { BookingStatus } from "@/types/index.ts";
import { cn } from "@/lib/utils.ts";

function StepCompletedIcon() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
      <CircleCheckBig className="h-[17px] w-[17px] text-white" strokeWidth={2} fill="none" aria-hidden />
    </span>
  );
}

const STEPS = [
  { id: "confirmed", label: "Confirmed" },
  { id: "checked_in", label: "Checked In" },
  { id: "checked_out", label: "Checked Out" },
  { id: "completed", label: "Completed" },
] as const;

function getStepperState(status: BookingStatus) {
  switch (status) {
    case "pending":
      return { completedIndex: -1, currentIndex: 0 };
    case "confirmed":
      return { completedIndex: -1, currentIndex: 0 };
    case "checked_in":
      return { completedIndex: 1, currentIndex: 2 };
    case "checked_out":
      return { completedIndex: 2, currentIndex: 3 };
    case "completed":
      return { completedIndex: 3, currentIndex: 3 };
    default:
      return null;
  }
}

type BookingStatusStepperProps = {
  status: BookingStatus;
  className?: string;
};

export function BookingStatusStepper({ status, className }: BookingStatusStepperProps) {
  const state = getStepperState(status);
  if (!state) return null;

  const { completedIndex, currentIndex } = state;
  const allComplete = status === "completed";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/60 px-3 py-3 sm:px-4 sm:py-3",
        className,
      )}
    >
      <ol className="flex items-start w-full">
        {STEPS.map((step, index) => {
          const isCompleted = allComplete ? true : index <= completedIndex;
          const isCurrent = !allComplete && index === currentIndex;

          return (
            <li key={step.id} className="contents">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                {isCompleted ? (
                  <StepCompletedIcon />
                ) : (
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      isCurrent && "border-2 border-green-500 bg-background text-green-600 dark:text-green-400",
                      !isCurrent && "border-2 border-border bg-background text-muted-foreground",
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {index + 1}
                  </div>
                )}
                <span
                  className={cn(
                    "text-center text-[10px] font-medium leading-none sm:text-[11px]",
                    isCompleted && "text-primary",
                    isCurrent && "text-green-600 dark:text-green-400",
                    !isCompleted && !isCurrent && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mt-3.5 h-0.5 min-w-2 flex-1 shrink",
                    index <= completedIndex ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
