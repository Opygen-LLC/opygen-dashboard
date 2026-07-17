import { z } from 'zod';

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().optional().default(''),
  status: z.enum(['todo', 'in_progress', 'in_review', 'completed', 'on_hold']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')).default([]),
  dueDate: z.string().optional().nullable().transform(val => val ? new Date(val) : undefined),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const commentSchema = z.object({
  message: z.string().min(1, 'Comment message cannot be empty'),
});

export type CommentInput = z.infer<typeof commentSchema>;

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export type ProfileInput = z.infer<typeof profileSchema>;
