'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2, User, Key, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { profileSchema, ProfileInput } from '@/lib/validations';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { data: session, update, status } = useSession();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: {
      name: session?.user?.name || '',
      avatarUrl: session?.user?.avatarUrl || '',
      password: '',
    },
  });

  const avatarWatch = watch('avatarUrl');
  const nameWatch = watch('name');

  const profileMutation = useMutation({
    mutationFn: async (formData: ProfileInput) => {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: async (data) => {
      toast.success('Profile updated successfully!');
      await update({
        name: data.user.name,
        avatarUrl: data.user.avatarUrl,
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile');
    },
  });

  const onSubmit = (data: ProfileInput) => {
    profileMutation.mutate(data);
  };

  if (status === 'loading') {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal co-founder profile settings.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border bg-card/60 text-card-foreground shadow-md backdrop-blur-xs">
          <CardHeader className="border-b border-border/60 pb-6 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-20 w-20 border border-indigo-500/30">
              <AvatarImage src={avatarWatch || ''} alt={nameWatch || 'User'} />
              <AvatarFallback className="bg-accent text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
                {nameWatch?.substring(0, 2).toUpperCase() || 'OP'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left space-y-1">
              <CardTitle className="text-xl font-bold">{session?.user?.name}</CardTitle>
              <CardDescription className="text-muted-foreground">{session?.user?.email}</CardDescription>
              <div className="flex items-center gap-1.5 justify-center md:justify-start mt-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-250 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                  Co-Founder / {session?.user?.role}
                </span>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Alice"
                    {...register('name')}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="avatarUrl"
                    placeholder="https://api.dicebear.com/..."
                    {...register('avatarUrl')}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                {errors.avatarUrl && (
                  <p className="text-xs text-destructive mt-1">{errors.avatarUrl.message as string}</p>
                )}
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Provide an image URL (such as a Dicebear or Gravatar SVG link) to change your display avatar.
                </p>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4">
                <Label htmlFor="password">New Password (Optional)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password.message as string}</p>
                )}
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Leave blank to keep your current password. Passwords must be at least 6 characters.
                </p>
              </div>
            </CardContent>

            <CardFooter className="p-6 border-t border-border/60 flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Secure password hashing enabled</span>
              </div>
              <Button
                type="submit"
                disabled={profileMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10"
              >
                {profileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
