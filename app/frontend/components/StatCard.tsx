"use client";

import { StaggerItem } from "./Motion";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "teal",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "teal" | "sky" | "amber" | "rose";
}) {
  const accents = {
    teal: "text-teal-300 bg-teal-400/10",
    sky: "text-sky-300 bg-sky-400/10",
    amber: "text-amber-300 bg-amber-400/10",
    rose: "text-rose-300 bg-rose-400/10",
  };

  return (
    <StaggerItem className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">
            {label}
          </p>
          <p className="mt-2 text-3xl font-display font-semibold tracking-tight">
            {value}
          </p>
          {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </StaggerItem>
  );
}
