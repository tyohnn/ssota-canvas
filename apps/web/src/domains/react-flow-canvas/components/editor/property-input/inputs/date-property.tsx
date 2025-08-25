"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/ui/button";
import { Calendar } from "@workspace/ui/components/ui/calendar";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/ui/collapsible";
import { ScrollArea } from "@workspace/ui/components/ui/scroll-area";
import {
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfYear,
  format,
  isAfter,
  isBefore,
  startOfYear,
} from "date-fns";
import { cn } from "@workspace/ui/lib/utils";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type { Block } from "@/db/schema";
import { getValue } from "../object-path";
import { useBlockPropertyUpdate } from "../useBlockPropertyUpdate";

// Local type definitions
type CaptionLabelProps = React.HTMLAttributes<HTMLSpanElement>;
type MonthGridProps = React.TableHTMLAttributes<HTMLTableElement>;

export function DateProperty({
  block,
  field,
}: {
  block: Block;
  field: EditorField;
}) {
  const { updateMetadata } = useBlockPropertyUpdate(block);
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [isYearView, setIsYearView] = useState(false);

  const raw = getValue(block?.metadata || {}, field.path);
  const value = typeof raw === "string" ? raw : "";
  const date = value ? new Date(value) : undefined;

  const startDate = new Date(1980, 6);
  const endDate = new Date(2030, 6);

  const years = eachYearOfInterval({
    start: startOfYear(startDate),
    end: endOfYear(endDate),
  });

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      updateMetadata(field.path, dateString);
    } else {
      updateMetadata(field.path, "");
    }
    setIsOpen(false);
  };

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth);
    setIsYearView(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 transition-[color,box-shadow] select-none cursor-pointer ${
            isOpen
              ? "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border border-ring ring-ring/50 ring-[3px]"
              : ""
          }`}
        >
          <span className={cn("truncate", !date && "text-muted-foreground")}>
            {date ? format(date, "PPP") : field.placeholder || "Pick a date"}
          </span>
          <CalendarIcon
            size={16}
            className="text-muted-foreground/80 ml-auto shrink-0 transition-colors"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0 shadow-none" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          month={month}
          onMonthChange={handleMonthChange}
          defaultMonth={new Date()}
          startMonth={startDate}
          endMonth={endDate}
          className="overflow-hidden rounded-md border border-border p-2 min-h-[280px]"
          classNames={{
            month_caption: "ms-2.5 me-20 justify-start",
            nav: "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-end",
          }}
          components={{
            CaptionLabel: (props: CaptionLabelProps) => (
              <CaptionLabel
                isYearView={isYearView}
                setIsYearView={setIsYearView}
                {...props}
              />
            ),
            MonthGrid: (props: MonthGridProps) => {
              return (
                <MonthGrid
                  className={props.className}
                  isYearView={isYearView}
                  setIsYearView={setIsYearView}
                  startDate={startDate}
                  endDate={endDate}
                  years={years}
                  currentYear={month.getFullYear()}
                  currentMonth={month.getMonth()}
                  onMonthSelect={(selectedMonth: Date) => {
                    setMonth(selectedMonth);
                    setIsYearView(false);
                  }}
                >
                  {props.children}
                </MonthGrid>
              );
            },
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function MonthGrid({
  className,
  children,
  isYearView,
  startDate,
  endDate,
  years,
  currentYear,
  currentMonth,
  onMonthSelect,
}: {
  className?: string;
  children: React.ReactNode;
  isYearView: boolean;
  setIsYearView: React.Dispatch<React.SetStateAction<boolean>>;
  startDate: Date;
  endDate: Date;
  years: Date[];
  currentYear: number;
  currentMonth: number;
  onMonthSelect: (date: Date) => void;
}) {
  const currentYearRef = useRef<HTMLDivElement>(null);
  const currentMonthButtonRef = useRef<HTMLButtonElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isYearView && currentYearRef.current && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement;
      if (viewport) {
        const yearTop = currentYearRef.current.offsetTop;
        viewport.scrollTop = yearTop;
      }
      setTimeout(() => {
        currentMonthButtonRef.current?.focus();
      }, 100);
    }
  }, [isYearView]);

  return (
    <div className="relative">
      <table className={className}>{children}</table>
      {isYearView && (
        <div className="bg-background absolute inset-0 z-20 -mx-2 -mb-2">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            {years.map((year) => {
              const months = eachMonthOfInterval({
                start: startOfYear(year),
                end: endOfYear(year),
              });
              const isCurrentYear = year.getFullYear() === currentYear;

              return (
                <div
                  key={year.getFullYear()}
                  ref={isCurrentYear ? currentYearRef : undefined}
                >
                  <CollapsibleYear
                    title={year.getFullYear().toString()}
                    open={isCurrentYear}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month) => {
                        const isDisabled =
                          isBefore(month, startDate) || isAfter(month, endDate);
                        const isCurrentMonth =
                          month.getMonth() === currentMonth &&
                          year.getFullYear() === currentYear;

                        return (
                          <Button
                            key={month.getTime()}
                            ref={
                              isCurrentMonth ? currentMonthButtonRef : undefined
                            }
                            variant={isCurrentMonth ? "default" : "outline"}
                            size="sm"
                            className="h-7"
                            disabled={isDisabled}
                            onClick={() => onMonthSelect(month)}
                          >
                            {format(month, "MMM")}
                          </Button>
                        );
                      })}
                    </div>
                  </CollapsibleYear>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function CaptionLabel({
  children,
  isYearView,
  setIsYearView,
}: {
  isYearView: boolean;
  setIsYearView: React.Dispatch<React.SetStateAction<boolean>>;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <Button
      className="data-[state=open]:text-muted-foreground/80 -ms-2 flex items-center gap-2 text-sm font-medium hover:bg-transparent [&[data-state=open]>svg]:rotate-180"
      variant="ghost"
      size="sm"
      onClick={() => setIsYearView((prev) => !prev)}
      data-state={isYearView ? "open" : "closed"}
    >
      {children}
      <ChevronDownIcon
        size={16}
        className="text-muted-foreground/80 shrink-0 transition-transform duration-200"
        aria-hidden="true"
      />
    </Button>
  );
}

function CollapsibleYear({
  title,
  children,
  open,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <Collapsible className="border-t px-2 py-1.5" defaultOpen={open}>
      <CollapsibleTrigger asChild>
        <Button
          className="flex w-full justify-start gap-2 text-sm font-medium hover:bg-transparent [&[data-state=open]>svg]:rotate-180"
          variant="ghost"
          size="sm"
        >
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground/80 shrink-0 transition-transform duration-200"
            aria-hidden="true"
          />
          {title}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden px-3 py-1 text-sm transition-all">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
