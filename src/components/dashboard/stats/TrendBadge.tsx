import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface TrendBadgeProps {
    trend: string | null | undefined;
}

export function TrendBadge({ trend }: TrendBadgeProps) {
    if (!trend) return null;

    const isPositive = trend.startsWith("+");
    const isNegative = trend.startsWith("-");

    let Icon = Minus;
    let colors = "bg-slate-500/10 text-slate-500 border-slate-500/20";

    if (isPositive) {
        Icon = ArrowUpRight;
        colors =
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    } else if (isNegative) {
        Icon = ArrowDownRight;
        colors =
            "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border backdrop-blur-sm shadow-sm ${colors}`}
        >
            <Icon className="h-3 w-3" />
            {trend}
        </span>
    );
}
