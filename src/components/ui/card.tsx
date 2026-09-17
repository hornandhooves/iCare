import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,.08)] ${className}`}
      {...props}
    />
  );
}
