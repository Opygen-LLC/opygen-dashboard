"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, CheckCircle2, ShieldAlert, Eye, EyeOff } from "lucide-react";
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
import AuthThemeToggler from "@/components/AuthThemeToggler";

const changePasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ForcedChangePasswordPage() {
    const router = useRouter();
    const { data: session, update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ChangePasswordFormValues) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/users/change-password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: data.password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Something went wrong");
            }

            setIsSuccess(true);
            toast.success("Your password has been securely updated!");

            // Update client session token to mark needPasswordChange as false and status as active
            await update({
                ...session,
                needPasswordChange: false,
                status: 'active',
            });

            // Redirect based on role
            setTimeout(() => {
                const target =
                    session?.user?.role === "admin"
                        ? "/admin-dashboard"
                        : "/dashboard";
                router.push(target);
                router.refresh();
            }, 2000);
        } catch (error: any) {
            toast.error(
                error.message ||
                    "An unexpected error occurred. Please try again.",
            );
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
                            Update Password
                        </CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            {isSuccess
                                ? "Your password has been changed successfully"
                                : "You must update your temporary password to access OpyDash"}
                        </CardDescription>
                    </CardHeader>

                    {isSuccess ? (
                        <CardContent className="space-y-4 py-6 text-center text-card-foreground">
                            <div className="flex justify-center mb-4">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500 dark:text-emerald-450 animate-bounce" />
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                Loading dashboard environment, please wait...
                            </p>
                        </CardContent>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs p-3 rounded-lg leading-relaxed">
                                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>
                                        Your account was created with a
                                        temporary password. For security
                                        reasons, please choose a new password
                                        before proceeding.
                                    </span>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Label htmlFor="password">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="At least 8 characters"
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

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Repeat your password"
                                            {...register("confirmPassword")}
                                            className="pl-10 pr-10 bg-background/50 border-border focus-visible:ring-indigo-500 text-foreground"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-xs text-destructive mt-1">
                                            {errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 mt-2">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
                                >
                                    {isLoading ? (
                                        <Loading variant="mini" text="Saving Password..." />
                                    ) : (
                                        "Complete Setup"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}
