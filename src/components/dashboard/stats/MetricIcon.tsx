import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricIconProps {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
}

export function MetricIcon({ icon: Icon, iconBg, iconColor }: MetricIconProps) {
    return (
        <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center ${iconBg} shadow-inner backdrop-blur-sm border border-current/10`}
        >
            <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
    );
}
