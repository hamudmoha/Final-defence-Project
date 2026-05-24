import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "./utils";

// Root
export function Dialog(props) {
    return <DialogPrimitive.Root {...props} />;
}

// Trigger
export function DialogTrigger(props) {
    return <DialogPrimitive.Trigger {...props} />;
}

// Portal
export function DialogPortal(props) {
    return <DialogPrimitive.Portal {...props} />;
}

// Close
export function DialogClose(props) {
    return <DialogPrimitive.Close {...props} />;
}

// Overlay
export function DialogOverlay({ className, ...props }) {
    return (
        <DialogPrimitive.Overlay
            className={cn(
                "fixed inset-0 z-50 bg-black/50",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                className
            )}
            {...props}
        />
    );
}

// Content
export function DialogContent({ className, children, ...props }) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                className={cn(
                    "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                    "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
                    className
                )}
                {...props}
            >
                {children}

                <DialogPrimitive.Close className="absolute right-4 top-4 opacity-70 hover:opacity-100">
                    <X className="w-4 h-4" />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

// Header
export function DialogHeader({ className, ...props }) {
    return (
        <div
            className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    );
}

// Footer
export function DialogFooter({ className, ...props }) {
    return (
        <div
            className={cn(
                "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
                className
            )}
            {...props}
        />
    );
}

// Title
export function DialogTitle({ className, ...props }) {
    return (
        <DialogPrimitive.Title
            className={cn("text-lg font-semibold", className)}
            {...props}
        />
    );
}

// Description
export function DialogDescription({ className, ...props }) {
    return (
        <DialogPrimitive.Description
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
}
