"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
} from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClientCalendarViewProps {
    clients: any[];
    onSelectClient: (client: any) => void;
}

export function ClientCalendarView({
    clients,
    onSelectClient,
}: ClientCalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [filterType, setFilterType] = useState<"all" | "meetings" | "followups">("all");

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Extract all scheduled events from clients
    const events = (Array.isArray(clients) ? clients : []).flatMap((client) => {
        const itemEvents: any[] = [];
        if (
            client.status === "Meeting Scheduled" &&
            client.meetingDate &&
            (filterType === "all" || filterType === "meetings")
        ) {
            itemEvents.push({
                id: `meeting-${client._id}`,
                client,
                type: "meeting",
                date: new Date(client.meetingDate),
                title: client.name,
                company: client.companyName,
            });
        }
        if (
            client.status === "Follow-up" &&
            client.followupDate &&
            (filterType === "all" || filterType === "followups")
        ) {
            itemEvents.push({
                id: `followup-${client._id}`,
                client,
                type: "followup",
                date: new Date(client.followupDate),
                title: client.name,
                company: client.companyName,
            });
        }
        if (
            client.nextFollowupDate &&
            (filterType === "all" || filterType === "followups")
        ) {
            itemEvents.push({
                id: `next-followup-${client._id}`,
                client,
                type: "followup",
                date: new Date(client.nextFollowupDate),
                title: `${client.name} (Follow-up)`,
                company: client.companyName,
            });
        }
        return itemEvents;
    });

    const getEventsForDay = (day: Date) => {
        return events.filter((ev) => isSameDay(ev.date, day));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Header Controls */}
            <Card className="border-border bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="p-4 sm:p-6 pb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-extrabold tracking-tight">
                                    {format(currentMonth, "MMMM yyyy")}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Interactive schedule of meetings &amp; follow-ups
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Filter Pills */}
                            <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/50 text-xs font-semibold">
                                <button
                                    onClick={() => setFilterType("all")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                                        filterType === "all"
                                            ? "bg-background text-foreground shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterType("meetings")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                                        filterType === "meetings"
                                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                                    Meetings
                                </button>
                                <button
                                    onClick={() => setFilterType("followups")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                                        filterType === "followups"
                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Follow-ups
                                </button>
                            </div>

                            {/* Month Navigation */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToToday}
                                    className="h-8 text-xs font-bold px-2.5 cursor-pointer"
                                >
                                    Today
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={prevMonth}
                                    className="h-8 w-8 cursor-pointer"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={nextMonth}
                                    className="h-8 w-8 cursor-pointer"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Calendar Grid Container */}
            <Card className="border-border bg-card shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {/* Day Headers (Sun - Sat) */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider py-3">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    {/* Month Days Grid */}
                    <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
                        {days.map((day) => {
                            const dayEvents = getEventsForDay(day);
                            const isSelectedMonth = isSameMonth(day, currentMonth);
                            const isCurrentDay = isToday(day);

                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "min-h-[120px] p-2 transition-colors flex flex-col justify-start relative group",
                                        !isSelectedMonth && "bg-muted/10 opacity-40",
                                        isCurrentDay && "bg-indigo-500/5 dark:bg-indigo-500/10 font-bold",
                                        "hover:bg-muted/20",
                                    )}
                                >
                                    {/* Date Number Header */}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span
                                            className={cn(
                                                "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold",
                                                isCurrentDay
                                                    ? "bg-indigo-600 text-white font-extrabold shadow-xs"
                                                    : "text-foreground/80",
                                            )}
                                        >
                                            {format(day, "d")}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="text-[10px] font-bold text-muted-foreground">
                                                {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Day Events Stack */}
                                    <div className="space-y-1.5 overflow-y-auto max-h-[90px] custom-scrollbar pr-0.5">
                                        {dayEvents.map((ev) => (
                                            <motion.div
                                                key={ev.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => onSelectClient(ev.client)}
                                                className={cn(
                                                    "p-1.5 rounded-lg border text-left cursor-pointer transition-all shadow-xs flex flex-col gap-0.5 group/item",
                                                    ev.type === "meeting"
                                                        ? "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300"
                                                        : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300",
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="font-bold text-xs truncate leading-tight group-hover/item:underline">
                                                        {ev.title}
                                                    </span>
                                                    {ev.type === "meeting" ? (
                                                        <CalendarIcon className="h-3 w-3 shrink-0 text-purple-500" />
                                                    ) : (
                                                        <Clock className="h-3 w-3 shrink-0 text-amber-500" />
                                                    )}
                                                </div>
                                                {ev.company && (
                                                    <span className="text-[10px] opacity-80 truncate">
                                                        {ev.company}
                                                    </span>
                                                )}
                                                <span className="text-[9px] font-medium opacity-75 capitalize">
                                                    {ev.type === "meeting" ? "Meeting" : "Follow-up"}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
