"use client";

import React from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Compass,
    FileQuestion,
    FolderKanban,
    Home,
    LayoutDashboard,
    SearchX,
    Sparkles,
    Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function GlobalNotFoundPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
            {/* Header */}
            <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex h-16 items-center justify-center px-6 border-b border-border/80">
                        <Link href={`/admin-dashboard`} className="flex items-center gap-2.5">
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
                        </Link>
                    </div>
                    <Badge
                        variant="outline"
                        className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30 text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5"
                    >
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                        404 Error
                    </Badge>
                </div>
            </header>

            {/* Center Content */}
            <main className="max-w-3xl w-full mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
                <Card className="w-full border-border/80 bg-gradient-to-br from-card via-card to-indigo-950/10 shadow-2xl overflow-hidden relative rounded-3xl">
                    <div className="pointer-events-none absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent opacity-70" />

                    <CardContent className="p-8 sm:p-12 text-center relative z-10 space-y-8">
                        {/* 404 Visual Icon Badge */}
                        <div className="relative inline-flex">
                            <span className="absolute inset-0 rounded-3xl bg-indigo-500/25 blur-2xl animate-pulse" />
                            <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shadow-inner">
                                <SearchX className="h-12 w-12" />
                            </div>
                        </div>

                        {/* Text Headline */}
                        <div className="space-y-3">
                            <span className="text-xs font-extrabold tracking-widest text-indigo-500 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                404 Page Not Found
                            </span>
                            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                                Lost in Cyberspace?
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
                                The page you are trying to access doesn&apos;t
                                exist, has been moved, or the URL may contain a
                                typo.
                            </p>
                        </div>

                        {/* Quick Navigation Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                            <Link
                                href="/admin-dashboard"
                                className="p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between gap-3"
                            >
                                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <LayoutDashboard className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">
                                        Admin Dashboard
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Overview &amp; statistics
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="/admin-dashboard/projects"
                                className="p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between gap-3"
                            >
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FolderKanban className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">
                                        Projects Board
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Kanban &amp; milestone tasks
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="/admin-dashboard/clients"
                                className="p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between gap-3"
                            >
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">
                                        Clients Pipeline
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Client tracking &amp; meetings
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <Button
                                onClick={() => window.history.back()}
                                variant="outline"
                                className="w-full sm:w-auto font-bold px-5 py-2.5 h-11 rounded-md cursor-pointer gap-2 border-border"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </Button>
                            <Button
                                asChild
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 h-11 rounded-md shadow-md gap-2 cursor-pointer"
                            >
                                <Link href="/admin-dashboard" className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    Return to Home
                                </Link>
                            </Button>
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
