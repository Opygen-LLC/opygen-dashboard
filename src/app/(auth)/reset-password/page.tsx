'use client';

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('The password reset token is missing. Please request a new link.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      setIsSuccess(true);
      toast.success('Your password has been successfully updated!');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md text-slate-100 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold text-red-400">Invalid Link</CardTitle>
          <CardDescription className="text-center text-slate-400">
            This password reset link is missing a validation token.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 text-sm text-slate-300">
          Please check the reset URL or request a new password reset email.
        </CardContent>
        <div className="border-t border-slate-800/80 px-6 py-4 flex justify-center bg-slate-950/40 rounded-b-lg">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Request New Link
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md text-slate-100 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-bold">Reset Password</CardTitle>
        <CardDescription className="text-center text-slate-400">
          {isSuccess
            ? 'Your password has been changed successfully'
            : 'Enter and confirm your new co-founder account password'}
        </CardDescription>
      </CardHeader>

      {isSuccess ? (
        <CardContent className="space-y-4 py-6 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-bounce" />
          </div>
          <p className="text-sm text-slate-300">
            Your password has been securely updated. You will be redirected to the sign-in screen in a few seconds...
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
          >
            Go to Login Now
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  {...register('password')}
                  className="pl-10 bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-200"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  {...register('confirmPassword')}
                  className="pl-10 bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-200"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Password'
              )}
            </Button>
          </CardFooter>
        </form>
      )}

      {!isSuccess && (
        <div className="border-t border-slate-800/80 px-6 py-4 flex justify-center bg-slate-950/40 rounded-b-lg">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden text-slate-100 dark:text-slate-100">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            OpyDash
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Internal Project Management for Opygen
          </p>
        </div>

        <Suspense
          fallback={
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md text-slate-100 shadow-xl">
              <CardContent className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </CardContent>
            </Card>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
