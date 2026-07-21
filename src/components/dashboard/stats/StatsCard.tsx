import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { MetricIcon } from './MetricIcon';
import { TrendBadge } from './TrendBadge';
import AnimatedCounter from '../AnimatedCounter';

export interface StatsCardProps {
    title: string;
    value: number | string;
    description?: string;
    icon: any;
    iconBg: string;
    iconColor: string;
    trend?: string | null;
    badge?: boolean;
    isCurrency?: boolean;
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

export function StatsCard({ 
    title, 
    value, 
    description, 
    icon, 
    iconBg, 
    iconColor, 
    trend, 
    badge,
    isCurrency = false
}: StatsCardProps) {
    return (
        <motion.div variants={itemVariants}>
            <Card className="group relative overflow-hidden rounded-[20px] border border-border/60 bg-card shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.03)]">
                {badge && (
                    <span className="absolute right-4 top-4 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
                    </span>
                )}
                <div className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5" />
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-start justify-between mb-5">
                        <MetricIcon icon={icon} iconBg={iconBg} iconColor={iconColor} />
                        <TrendBadge trend={trend} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground">{title}</p>
                        <div className="text-3xl font-extrabold tracking-tight text-foreground flex items-baseline gap-1">
                            {isCurrency && <span className="text-xl text-muted-foreground/60 mr-0.5">$</span>}
                            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
                        </div>
                    </div>
                    {description && (
                        <p className="mt-3 text-[11px] text-muted-foreground/80 leading-relaxed max-w-[90%]">{description}</p>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
