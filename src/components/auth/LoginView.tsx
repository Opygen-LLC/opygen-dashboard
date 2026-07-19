"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import AuthThemeToggler from "@/components/AuthThemeToggler";

const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const res = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (res?.error) {
                toast.error(
                    res.error || "Authentication failed. Please try again.",
                );
            } else {
                toast.success("Logged in successfully!");
                const session = await getSession();
                if (session?.user?.role === "admin") {
                    router.push("/admin-dashboard");
                } else {
                    router.push("/dashboard");
                }
                router.refresh();
            }
        } catch {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden text-foreground transition-colors duration-200">
            <AuthThemeToggler />

            {/* Background gradients */}
            <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Opygen Logo"
                            width={40}
                            height={40}
                            className="object-contain dark:invert transition-all duration-300"
                        />
                        <h2 className="text-3xl font-extrabold bg-indigo-600 bg-clip-text text-transparent">
                            OpyDash
                        </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Internal Project Management for Opygen
                    </p>
                </div>

                <Card className="border-border bg-card/60 backdrop-blur-md text-card-foreground shadow-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center font-bold">
                            Sign In
                        </CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            Enter your credentials to access OpyDash
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        placeholder="name@opygen.com"
                                        type="email"
                                        autoComplete="email"
                                        {...register("email")}
                                        className="pl-10 bg-background/50 border-border focus-visible:ring-indigo-500 text-foreground"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-destructive mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        {...register("password")}
                                        className="pl-10 pr-10 bg-background/50 border-border focus-visible:ring-indigo-500 text-foreground"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-destructive mt-1">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 cursor-pointer"
                            >
                                {isLoading ? (
                                    <Loading variant="mini" text="Signing In..." />
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </CardContent>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
