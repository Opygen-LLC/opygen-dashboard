"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
    Bell,
    Check,
    CheckCheck,
    X,
    Briefcase,
    DollarSign,
    FileText,
    FolderKanban,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotificationItem {
    id: string;
    type: string;
    message: string;
    targetUrl?: string;
    createdAt: string;
    isRead: boolean;
    user?: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    projectTitle?: string;
}

interface NotificationsResponse {
    notifications: NotificationItem[];
    unreadCount: number;
}

export default function NotificationBellDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
    const [isDesktop, setIsDesktop] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    // Responsive screen check: Desktop (>= 768px) vs Mobile (< 768px)
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch notifications
    const { data, isLoading } = useQuery<NotificationsResponse>({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) throw new Error("Failed to fetch notifications");
            return res.json();
        },
        refetchInterval: 15000, // Poll every 15s to keep real-time fresh
    });

    // Mark single notification read
    const markReadMutation = useMutation({
        mutationFn: async (id?: string) => {
            const res = await fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id }),
            });
            if (!res.ok) throw new Error("Failed to mark notification read");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    // Mark all notifications read
    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAll: true }),
            });
            if (!res.ok) throw new Error("Failed to mark all notifications read");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    const filteredList = notifications.filter((n) =>
        filterTab === "unread" ? !n.isRead : true
    );

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "client_added":
                return <Briefcase className="h-4 w-4 text-blue-500" />;
            case "payment_submitted":
                return <DollarSign className="h-4 w-4 text-emerald-500" />;
            case "milestone_completed":
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case "quote_accepted":
                return <FileText className="h-4 w-4 text-violet-500" />;
            case "status_change":
            case "assignment_change":
            case "priority_change":
                return <FolderKanban className="h-4 w-4 text-amber-500" />;
            case "comment":
                return <MessageSquare className="h-4 w-4 text-indigo-500" />;
            default:
                return <Sparkles className="h-4 w-4 text-indigo-500" />;
        }
    };

    const handleItemClick = (notification: NotificationItem) => {
        if (!notification.isRead) {
            markReadMutation.mutate(notification.id);
        }
        if (notification.targetUrl) {
            router.push(notification.targetUrl);
            setIsOpen(false);
        }
    };

    // Slide animation direction based on viewport: Left on Desktop, Right on Mobile
    const initialPos = isDesktop ? "-100%" : "100%";
    const exitPos = isDesktop ? "-100%" : "100%";

    return (
        <>
            {/* Bell Trigger Button */}
            <div className="relative inline-block">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(true)}
                    className="relative text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer h-9 w-9 rounded-lg"
                    title="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-md animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </div>

            {/* Slide-Over Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <div className={`fixed inset-0 z-[120] flex ${isDesktop ? "justify-start" : "justify-end"}`}>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
                        />

                        {/* Panel Container */}
                        <motion.div
                            initial={{ x: initialPos }}
                            animate={{ x: 0 }}
                            exit={{ x: exitPos }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className={`relative w-full max-w-sm sm:max-w-md h-full bg-card ${
                                isDesktop ? "border-r" : "border-l"
                            } border-border shadow-2xl flex flex-col z-[130]`}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Bell className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                                            Activity Notifications
                                            {unreadCount > 0 && (
                                                <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px]">
                                                    {unreadCount} unread
                                                </Badge>
                                            )}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">Real-time team updates & alerts</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Subheader Controls */}
                            <div className="p-3 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs">
                                    <button
                                        onClick={() => setFilterTab("all")}
                                        className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-all ${
                                            filterTab === "all"
                                                ? "bg-background text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilterTab("unread")}
                                        className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-all ${
                                            filterTab === "unread"
                                                ? "bg-background text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Unread ({unreadCount})
                                    </button>
                                </div>

                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAllReadMutation.mutate()}
                                        disabled={markAllReadMutation.isPending}
                                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 h-7 px-2 cursor-pointer gap-1"
                                    >
                                        <CheckCheck className="h-3.5 w-3.5" />
                                        Mark all read
                                    </Button>
                                )}
                            </div>

                            {/* Notifications Feed */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {isLoading ? (
                                    <div className="space-y-3 py-6">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-16 bg-muted/40 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredList.length > 0 ? (
                                    filteredList.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleItemClick(item)}
                                            className={`p-3 rounded-lg border transition-all duration-150 cursor-pointer flex items-start gap-3 relative ${
                                                !item.isRead
                                                    ? "bg-indigo-500/5 border-indigo-500/30 hover:bg-indigo-500/10"
                                                    : "bg-card/40 border-border/60 hover:bg-muted/40 opacity-85"
                                            }`}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-card border border-border/80 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                                {getNotificationIcon(item.type)}
                                            </div>

                                            <div className="flex-1 overflow-hidden space-y-1">
                                                <p className="text-xs font-medium text-foreground leading-snug">
                                                    {item.message}
                                                </p>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span>
                                                        {formatDistanceToNow(new Date(item.createdAt), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                    {item.projectTitle && (
                                                        <span className="font-semibold text-indigo-500 truncate max-w-[120px]">
                                                            {item.projectTitle}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {!item.isRead && (
                                                <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                        <Bell className="h-10 w-10 stroke-1 opacity-40 mb-2" />
                                        <p className="text-xs font-medium">No notifications to show</p>
                                        <p className="text-[11px] opacity-70">
                                            {filterTab === "unread"
                                                ? "You've read all your notifications!"
                                                : "Activity log notifications will appear here."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
