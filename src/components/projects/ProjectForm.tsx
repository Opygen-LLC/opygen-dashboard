'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { projectSchema, ProjectInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectFormProps {
  initialData?: Partial<ProjectInput> & { _id?: string; assignees?: any[] };
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export default function ProjectForm({ initialData, onSubmit, isLoading, onCancel }: ProjectFormProps) {
  const { data: users, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  const getInitialAssigneeIds = (): string[] => {
    if (!initialData?.assignees) return [];
    return initialData.assignees.map((a: any) => (typeof a === 'object' && a !== null ? a._id : a));
  };

  const formattedInitialData = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'todo',
    priority: initialData?.priority || 'medium',
    assignees: getInitialAssigneeIds(),
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().substring(0, 10)
      : '',
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(projectSchema),
    defaultValues: formattedInitialData,
  });

  const selectedAssignees = watch('assignees') || [];

  const handleAssigneeToggle = (userId: string) => {
    if (selectedAssignees.includes(userId)) {
      setValue(
        'assignees',
        selectedAssignees.filter((id: string) => id !== userId)
      );
    } else {
      setValue('assignees', [...selectedAssignees, userId]);
    }
  };

  const onFormSubmit = (data: any) => {
    const payload = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-foreground">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground/80">Project Title</Label>
        <Input
          id="title"
          placeholder="e.g. Implement OpyDash Auth"
          {...register('title')}
          className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground/80">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the goals and scope of this project..."
          rows={3}
          {...register('description')}
          className="bg-background border-border text-foreground focus-visible:ring-indigo-500 resize-none leading-relaxed"
        />
        {errors.description && (
          <p className="text-xs text-destructive mt-1">{errors.description.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status" className="text-foreground/80">Status</Label>
          <Select
            value={watch('status')}
            onValueChange={(val) => setValue('status', val || 'todo')}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority" className="text-foreground/80">Priority</Label>
          <Select
            value={watch('priority')}
            onValueChange={(val) => setValue('priority', val || 'medium')}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground/80">Assignees</Label>
        {isLoadingUsers ? (
          <div className="flex h-10 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3 max-h-[160px] overflow-y-auto">
            {users?.map((user) => (
              <div
                key={user._id}
                onClick={() => handleAssigneeToggle(user._id)}
                className={`flex items-center gap-2 rounded-md p-1.5 hover:bg-accent cursor-pointer transition-colors ${
                  selectedAssignees.includes(user._id)
                    ? 'bg-accent/80 border border-indigo-500/20 dark:border-indigo-500/30'
                    : 'border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedAssignees.includes(user._id)}
                  onChange={() => {}}
                  className="rounded border-border bg-background text-indigo-600 focus:ring-indigo-500/30 h-4 w-4 pointer-events-none"
                />
                <Avatar className="h-6 w-6 pointer-events-none">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-[10px] bg-accent text-muted-foreground font-bold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground/90 truncate pointer-events-none">{user.name}</span>
              </div>
            ))}
          </div>
        )}
        {errors.assignees && (
          <p className="text-xs text-destructive mt-1">{errors.assignees.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate" className="text-foreground/80">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          {...register('dueDate')}
          className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
        />
        {errors.dueDate && (
          <p className="text-xs text-destructive mt-1">{errors.dueDate.message as string}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Project'
          )}
        </Button>
      </div>
    </form>
  );
}
