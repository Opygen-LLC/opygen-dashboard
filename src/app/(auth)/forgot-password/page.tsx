'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      setIsSubmitted(true);
      toast.success('Password reset link has been dispatched.');
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md text-slate-100 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold">Forgot Password</CardTitle>
            <CardDescription className="text-center text-slate-400">
              {isSubmitted
                ? 'Check your inbox for password reset instructions'
                : 'Enter your email to request a secure password reset link'}
            </CardDescription>
          </CardHeader>
          
          {isSubmitted ? (
            <CardContent className="space-y-4 py-6 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-bounce" />
              </div>
              <p className="text-sm text-slate-300">
                If the email address matches a registered co-founder account, you will receive a secure password reset link shortly.
              </p>
              <p className="text-xs text-slate-500 font-mono mt-4">
                Note: In local development, the reset link is printed to the node server console.
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <Input
                      id="email"
                      placeholder="name@opygen.com"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className="pl-10 bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
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
                      Dispatching Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}

          <div className="border-t border-slate-800/80 px-6 py-4 flex justify-center bg-slate-950/40 rounded-b-lg">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
