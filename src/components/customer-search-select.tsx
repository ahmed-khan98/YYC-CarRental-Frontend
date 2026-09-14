import { useState } from "react";
import type { User } from "@/types/index.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import { Check, ChevronsUpDown } from "lucide-react";

function customerLabel(customer: User) {
  return `${customer.name ?? "Unknown"} — ${customer.email ?? "No email"}`;
}

function customerSearchValue(customer: User) {
  return [customer.name, customer.email, customer.phone].filter(Boolean).join(" ");
}

type CustomerSearchSelectProps = {
  customers: User[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function CustomerSearchSelect({
  customers,
  value,
  onChange,
  placeholder = "Select a customer",
  disabled = false,
}: CustomerSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = customers.find((customer) => customer._id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between px-3 font-normal shadow-xs",
            !selected && "text-muted-foreground",
          )}
        >
          <span className="truncate text-left">
            {selected ? customerLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search by name or email..." />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer._id}
                  value={customerSearchValue(customer)}
                  onSelect={() => {
                    onChange(customer._id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === customer._id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{customerLabel(customer)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
