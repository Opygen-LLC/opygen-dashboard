"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    onReset?: () => void;
    activeFilterCount?: number;
    title?: string;
    description?: string;
    children: React.ReactNode;
}

export function FilterDrawer({
    isOpen,
    onClose,
    onApply,
    onReset,
    activeFilterCount = 0,
    title = "Filter Options",
    description = "Refine your view with custom filter options.",
    children,
}: FilterDrawerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/70 backdrop-blur-xs cursor-pointer"
                    />

                    {/* Drawer Content */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 28,
                            stiffness: 300,
                        }}
                        className="relative w-full max-w-md bg-card border-l border-border shadow-2xl h-full flex flex-col justify-between z-[151] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-border/80 flex items-center justify-between bg-muted/20 shrink-0">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <Filter className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-lg font-bold text-foreground">
                                        {title}
                                    </h2>
                                    {activeFilterCount > 0 && (
                                        <Badge className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                            {activeFilterCount} Active
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground pl-8">
                                    {description}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Body / Options */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {children}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
                            {onReset ? (
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={onReset}
                                    className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-10 gap-1.5 cursor-pointer text-xs font-semibold"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Reset All
                                </Button>
                            ) : (
                                <div />
                            )}

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={onClose}
                                    className="h-10 text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        onApply();
                                        onClose();
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-5 gap-1.5 cursor-pointer shadow-md text-xs font-bold"
                                >
                                    <Check className="h-4 w-4" />
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
