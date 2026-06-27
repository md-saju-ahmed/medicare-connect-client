/**
 * ComboboxFilter
 *
 * A Popover + shadcn/ui Command combobox used everywhere in the admin
 * and public pages for status / role / method / sort filtering.
 *
 * Props:
 *   options      { value: string; label: string }[]
 *   value        string  — currently selected option value
 *   onChange     (value: string) => void
 *   placeholder  string  — shown when nothing is selected / "all" is active
 *   icon         LucideIcon | null  — optional leading icon inside the trigger
 *   width        string  — Tailwind class for trigger width (default "w-full sm:w-44")
 *   contentWidth string  — Tailwind class for popover width (default "w-[200px]")
 *   searchable   boolean — enables search input inside the combobox (default false)
 *   searchPlaceholder string — placeholder for search input (default "Search...")
 */
"use client";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ComboboxFilter({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon = null,
  width = "w-full sm:w-44",
  contentWidth = "w-[200px]",
  searchable = false,
  searchPlaceholder = "Search...",
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);
  const isDefault = !selectedOption || selectedOption.value === "all";

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`${width} justify-between font-normal bg-muted/10`}
        >
          <div className="flex items-center gap-2 truncate">
            {Icon && (
              <Icon size={16} className="shrink-0 text-muted-foreground" />
            )}
            <span className={isDefault ? "text-muted-foreground" : ""}>
              {selectedOption?.label ?? placeholder}
            </span>
          </div>
          <ChevronsUpDown size={14} className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className={`${contentWidth} p-0`} align="start">
        <Command>
          {searchable && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    size={16}
                    className={`mr-2 transition-opacity ${
                      value === option.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
