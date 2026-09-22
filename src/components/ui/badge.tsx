import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide",
  {
    variants: {
      tone: {
        muted: "bg-subtle text-muted",
        live: "bg-success/15 text-success",
        warn: "bg-warn/15 text-warn",
        danger: "bg-danger/15 text-danger",
        accent: "bg-accent/15 text-accent",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
