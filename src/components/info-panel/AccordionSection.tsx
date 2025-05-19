
"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type React from "react";

interface AccordionSectionProps {
  value: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function AccordionSection({ value, title, icon, children }: AccordionSectionProps) {
  return (
    <AccordionItem value={value} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3 px-2 text-left [&[data-state=open]>svg]:text-primary">
        <div className="flex items-center">
          {icon}
          {title}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3 px-2 pt-0">
        <div className="text-sm text-foreground bg-muted/30 p-3 rounded-md">
         {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
