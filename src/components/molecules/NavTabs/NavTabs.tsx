import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/atoms/Tabs/Tabs";
import { cn } from "@/lib/utils";

interface NavTabsProps {
  tabs: { value: string; label: string }[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function NavTabs({
  tabs,
  defaultValue,
  onValueChange,
  className,
}: NavTabsProps) {
  return (
    <Tabs
      defaultValue={defaultValue ?? tabs[0].value}
      onValueChange={onValueChange}
    >
      <TabsList
        className={cn(
          "w-full border-b bg-transparent p-0 justify-start gap-2",
          className
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "relative rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground",
              "hover:text-foreground",
              "data-[state=active]:border-primary data-[state=active]:text-foreground"
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
