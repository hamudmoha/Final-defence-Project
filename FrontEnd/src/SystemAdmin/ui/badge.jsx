import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] transition-colors overflow-hidden",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
                destructive:
                    "border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700",
                outline:
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export function Badge({
    className,
    variant = "default",
    asChild = false,
    ...props
}) {
    const Comp = asChild ? Slot : "span";

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { badgeVariants };
