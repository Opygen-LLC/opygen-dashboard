import React from "react";
import {
    FileQuestion,
    FolderX,
    MessageSquare,
    RefreshCw,
    ShieldAlert,
    Sparkles,
    ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function PortalNotFound() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
            {/* Header Navbar */}
            <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex h-16 items-center justify-center px-6 border-b border-border/80">
                        <div className="flex items-center gap-2.5">
                            <Image
                                src="/logo.png"
                                alt="Opygen Logo"
                                width={24}
                                height={24}
                                className="object-contain dark:invert transition-all duration-300"
                            />
                            <span className="text-lg font-extrabold tracking-tight bg-indigo-600 bg-clip-text text-transparent">
                                Opygen
                            </span>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5"
                    >
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        Link Error
                    </Badge>
                </div>
            </header>

            {/* Main Center Display */}
            <main className="max-w-2xl w-full mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
                <Card className="w-full border-border/80 bg-gradient-to-br from-card via-card to-rose-950/10 shadow-2xl overflow-hidden relative rounded-2xl">
                    <div className="pointer-events-none absolute inset-0 bg-radial from-rose-500/5 via-transparent to-transparent opacity-60" />

                    <CardContent className="p-8 sm:p-12 text-center relative z-10 space-y-6">
                        {/* Glow Icon Container */}
                        <div className="relative inline-flex mb-2">
                            <span className="absolute inset-0 rounded-3xl bg-rose-500/20 blur-xl animate-pulse" />
                            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
                                <FolderX className="h-10 w-10" />
                            </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                                Project Not Found
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
                                The project link you followed does not exist,
                                has been removed, or the project ID is invalid.
                            </p>
                        </div>

                        {/* Diagnostic Checklist Box */}
                        <div className="bg-muted/30 rounded-xl p-4 border border-border/60 text-left text-xs space-y-2.5 max-w-md mx-auto text-muted-foreground">
                            <p className="font-bold text-foreground flex items-center gap-1.5">
                                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                                Why am I seeing this?
                            </p>
                            <ul className="space-y-1.5 list-disc list-inside opacity-90 leading-relaxed">
                                <li>
                                    The URL might contain a typo or missing
                                    character.
                                </li>
                                <li>
                                    The project may have been deleted by the
                                    admin team.
                                </li>
                                <li>
                                    You might be using an old or broken project
                                    link.
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <a
                                href="https://opygen.com"
                                target="_blank"
                                rel="noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 text-sm shadow-md gap-2 transition-all cursor-pointer"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Visit Opygen
                            </a>
                            <a
                                href="mailto:opygen.info@gmail.com"
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-card border border-border hover:bg-muted text-foreground font-bold px-5 py-2.5 text-sm shadow-xs gap-2 transition-all cursor-pointer"
                            >
                                <MessageSquare className="h-4 w-4 text-indigo-500" />
                                Contact Support
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
                <p>
                    &copy; {new Date().getFullYear()} Opygen. All rights
                    reserved.
                </p>
            </footer>
        </div>
    );
}
