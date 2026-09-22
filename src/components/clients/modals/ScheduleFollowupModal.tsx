"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScheduleFollowupModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: any | null;
    onSave: (data: { followupDate: string; followupTime: string }) => void;
    isSubmitting?: boolean;
}

export function ScheduleFollowupModal({
    isOpen,
    onClose,
    client,
    onSave,
    isSubmitting = false,
}: ScheduleFollowupModalProps) {
    const [followupDate, setFollowupDate] = useState("");
    const [followupTime, setFollowupTime] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && client) {
            let initialDate = "";
            let initialTime = client.followupTime || "";

            if (client.followupDate) {
                const d = new Date(client.followupDate);
                if (!isNaN(d.getTime())) {
                    initialDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    if (!initialTime && (d.getHours() !== 0 || d.getMinutes() !== 0)) {
                        initialTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                    }
                }
            } else {
                const now = new Date();
                initialDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            }

            setFollowupDate(initialDate);
            setFollowupTime(initialTime);
            setError("");
        }
    }, [isOpen, client]);

    if (!client) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!followupDate || followupDate.trim() === "") {
            setError("Follow-up date is required");
            return;
        }
        setError("");
        onSave({ followupDate, followupTime });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/60"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-card/90 backdrop-blur-xl border border-border/60 shadow-2xl rounded-3xl overflow-hidden flex flex-col ring-1 ring-white/10 dark:ring-white/5"
                    >
                        {/* Top Gradient */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                        {/* Header */}
                        <div className="relative flex items-center justify-between p-6 pb-4 border-b border-border/40">
                            <div>
                                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                    Schedule Follow-up
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Set follow-up date and time for{" "}
                                    <span className="font-semibold text-foreground">
                                        {client.name}
                                    </span>
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                    Follow-up Date{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    value={followupDate}
                                    onChange={(e) => {
                                        setFollowupDate(e.target.value);
                                        if (e.target.value) setError("");
                                    }}
                                    className={error ? "border-rose-500" : ""}
                                />
                                {error && (
                                    <p className="text-xs text-rose-500">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                                    Follow-up Time
                                </label>
                                <Input
                                    type="time"
                                    value={followupTime}
                                    onChange={(e) =>
                                        setFollowupTime(e.target.value)
                                    }
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Optional. Set a specific time for the reminder.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="h-9 px-4 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {isSubmitting ? "Saving..." : "Save Follow-up"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
