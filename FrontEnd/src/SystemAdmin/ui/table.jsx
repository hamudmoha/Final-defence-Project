import React from "react";
import { cn } from "./utils";

// Table wrapper
export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

// Header
export function TableHeader({ className, ...props }) {
  return (
    <thead
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

// Body
export function TableBody({ className, ...props }) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

// Footer
export function TableFooter({ className, ...props }) {
  return (
    <tfoot
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

// Row
export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

// Head cell
export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-semibold whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

// Cell
export function TableCell({ className, ...props }) {
  return (
    <td
      className={cn(
        "p-4 align-middle whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

// Caption
export function TableCaption({ className, ...props }) {
  return (
    <caption
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
