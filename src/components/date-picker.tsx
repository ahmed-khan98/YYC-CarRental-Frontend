import { memo, useCallback, useMemo, useState, type ComponentProps } from "react";
import { format, parseISO, startOfDay, startOfMonth } from "date-fns";
import { DayButton, type Matcher } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";

function parseYmd(value: string | undefined) {
  if (!value) return undefined;
  try {
    return startOfDay(parseISO(value));
  } catch {
    return undefined;
  }
}

function toYmd(date: Date) {
  return format(date, "yyyy-MM-dd");
}

const calendarClassNames = {
  month: "space-y-2 relative",
  month_caption: "flex justify-center pt-0.5 relative items-center mb-0.5 h-8 pointer-events-none z-0",
  caption_label: "text-sm font-semibold",
  nav: "absolute inset-x-0 top-0 z-30 flex items-center justify-between px-1",
  button_previous:
    "relative z-30 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background p-0 hover:bg-muted shadow-sm [&>svg]:size-3.5",
  button_next:
    "relative z-30 ml-auto inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background p-0 hover:bg-muted shadow-sm [&>svg]:size-3.5",
  weekdays: "flex",
  weekday:
    "text-muted-foreground/70 rounded-md flex-1 font-medium text-[0.65rem] uppercase select-none",
  week: "flex w-full mt-0.5",
  day: "h-8 w-8 p-0",
  today: "font-bold text-primary",
  outside: "text-muted-foreground/50",
  disabled: "text-muted-foreground/55",
} as const;

const SingleDayButton = memo(function SingleDayButton({
  className,
  day,
  modifiers,
  selectedHint,
  ...props
}: ComponentProps<typeof DayButton> & { selectedHint?: string }) {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center">
      {modifiers.selected && selectedHint && (
        <span className="pointer-events-none absolute -top-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
          {selectedHint}
        </span>
      )}
      <button
        type="button"
        {...props}
        className={cn(
          "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-xs font-semibold transition-colors",
          "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          modifiers.selected &&
            "border-2 border-primary bg-background text-foreground hover:bg-background",
          modifiers.outside && "font-normal text-muted-foreground/45",
          modifiers.disabled &&
            "pointer-events-none cursor-not-allowed font-normal text-muted-foreground/55 hover:bg-transparent",
          className,
        )}
      >
        {day.date.getDate()}
      </button>
    </div>
  );
});

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  label: string;
  selectedHint?: string;
  className?: string;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
  placeholder?: string;
  id?: string;
};

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  selectedHint,
  className,
  triggerClassName,
  align = "start",
  placeholder = "Add date",
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    startOfMonth(parseYmd(value) ?? startOfDay(new Date())),
  );

  const min = useMemo(() => (minDate ? parseYmd(minDate) : undefined), [minDate]);
  const max = useMemo(() => (maxDate ? parseYmd(maxDate) : undefined), [maxDate]);
  const selected = useMemo(() => parseYmd(value), [value]);

  const disabled = useMemo((): Matcher | undefined => {
    if (min && max) return { before: min, after: max };
    if (min) return { before: min };
    if (max) return { after: max };
    return undefined;
  }, [min, max]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setCalendarMonth(startOfMonth(selected ?? min ?? startOfDay(new Date())));
      }
      setOpen(nextOpen);
    },
    [min, selected],
  );

  const handleSelect = useCallback(
    (day: Date | undefined) => {
      if (!day) return;
      onChange(toYmd(day));
      setOpen(false);
    },
    [onChange],
  );

  const displayValue = selected ? format(selected, "MMM d, yyyy") : placeholder;
  const triggerLabel = value ? format(parseISO(value), "MMM d, yyyy") : placeholder;
  const hint = selectedHint ?? label;

  const DayButtonComponent = useMemo(
    () =>
      function DayButtonWithHint(props: ComponentProps<typeof DayButton>) {
        return <SingleDayButton {...props} selectedHint={hint} />;
      },
    [hint],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "flex w-full items-center gap-2 text-left text-sm outline-none",
            triggerClassName ??
              "h-10 min-h-10 rounded-md border border-input bg-background px-3 shadow-xs transition-colors hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            !triggerClassName && !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate font-medium">{triggerLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto p-0 border-border/60 shadow-xl rounded-xl overflow-hidden"
        sideOffset={8}
      >
        <div className="border-b border-border/50 px-4 py-2.5 bg-muted/20">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "text-sm font-semibold mt-0.5",
              !selected && "text-muted-foreground font-normal",
            )}
          >
            {displayValue}
          </p>
        </div>

        {open && (
          <Calendar
            mode="single"
            numberOfMonths={1}
            defaultMonth={calendarMonth}
            selected={selected}
            onSelect={handleSelect}
            disabled={disabled}
            showOutsideDays
            fixedWeeks
            className="p-3 [--cell-size:2rem]"
            classNames={calendarClassNames}
            components={{ DayButton: DayButtonComponent }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
