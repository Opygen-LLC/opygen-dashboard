'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, Calendar, AlertTriangle, MessageSquare, Send, Trash2, Edit2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProjectForm from './ProjectForm';

interface ProjectDetailsProps {
  projectId: string;
  onClose: () => void;
}

export default function ProjectDetails({ projectId, onClose }: ProjectDetailsProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: project, isLoading, error } = useQuery<any>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json();
    },
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery<any[]>({
    queryKey: ['activities', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/activity`);
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['project', projectId], data);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      toast.success('Project updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update project');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Project deleted successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to delete project');
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/projects/${projectId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      setCommentText('');
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-card border-l border-border">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center p-8 bg-card border-l border-border h-full flex flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Error Loading Project</h3>
        <p className="text-sm text-muted-foreground mt-2">The project could not be found or loaded.</p>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    );
  }

  const handleStatusChange = (status: string | null) => {
    if (status) {
      updateMutation.mutate({ status });
    }
  };

  const handlePriorityChange = (priority: string | null) => {
    if (priority) {
      updateMutation.mutate({ priority });
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project? This action is permanent.')) {
      deleteMutation.mutate();
    }
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20',
    medium: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-450 dark:border-yellow-500/20',
    high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-450 dark:border-orange-500/20',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20 animate-pulse',
  };

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    completed: 'Completed',
    on_hold: 'On Hold',
  };

  const logTypeIcons = {
    comment: MessageSquare,
    status_change: ArrowRight,
    assignment_change: ArrowRight,
    priority_change: ArrowRight,
    details_change: Edit2,
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border text-foreground overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-accent/20">
        <div className="flex items-center gap-3">
          <Badge className={`capitalize border ${priorityColors[project.priority] || ''}`}>
            {project.priority}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {format(new Date(project.updatedAt), 'MMM dd, yyyy HH:mm')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground"
                title="Edit Project"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                disabled={deleteMutation.isPending}
                title="Delete Project"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isEditing ? (
          <div className="bg-accent/5 p-4 rounded-lg border border-border/80">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Edit Project Details</h3>
            <ProjectForm
              initialData={project}
              onSubmit={(data) => updateMutation.mutate(data)}
              isLoading={updateMutation.isPending}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">{project.title}</h2>
              <p className="text-muted-foreground mt-3 text-sm whitespace-pre-wrap leading-relaxed">
                {project.description || <span className="italic text-muted-foreground/60">No description provided.</span>}
              </p>
            </div>

            {/* Quick Status / Priority Inline Updates */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-accent/10 border border-border">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                <Select value={project.status} onValueChange={handleStatusChange} disabled={updateMutation.isPending}>
                  <SelectTrigger className="bg-background border-border text-foreground h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {Object.keys(statusLabels).map((key) => (
                      <SelectItem key={key} value={key}>
                        {statusLabels[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</span>
                <Select value={project.priority} onValueChange={handlePriorityChange} disabled={updateMutation.isPending}>
                  <SelectTrigger className="bg-background border-border text-foreground h-9">
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

            {/* Date and Assignees info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <span>Due Date:</span>
                <span className="font-bold text-foreground">
                  {project.dueDate ? format(new Date(project.dueDate), 'PPP') : 'No due date set'}
                </span>
                {project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'completed' && (
                  <Badge variant="destructive" className="ml-2 text-xs py-0 px-1.5 font-bold uppercase animate-pulse">
                    Overdue
                  </Badge>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Assignees ({project.assignees.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {project.assignees.map((user: any) => (
                    <div key={user._id} className="flex items-center gap-2 bg-background border border-border rounded-full py-1 px-3 pr-4">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="bg-accent text-muted-foreground text-xs">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground/80">{user.name}</span>
                    </div>
                  ))}
                  {project.assignees.length === 0 && (
                    <p className="text-xs italic text-muted-foreground/60">Unassigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Logs & Comments */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <MessageSquare className="h-5 w-5 text-indigo-550 dark:text-indigo-400" />
                Activity & Comments
              </h3>

              {/* Comment submission form */}
              <form onSubmit={handleCommentSubmit} className="flex items-start gap-2 bg-background p-2 rounded-lg border border-border">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post a comment..."
                  rows={2}
                  className="bg-transparent border-none text-foreground text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 resize-none flex-1 p-2 focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={commentMutation.isPending || !commentText.trim()}
                  size="icon"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 self-end mb-1 mr-1"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {/* Log List */}
              {isLoadingActivities ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {activities?.map((log) => {
                      const LogIcon = logTypeIcons[log.type as keyof typeof logTypeIcons] || MessageSquare;
                      const isComment = log.type === 'comment';

                      return (
                        <motion.div
                          key={log._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex items-start gap-3 text-sm p-3 rounded-lg border ${
                            isComment
                              ? 'bg-accent/15 border-border'
                              : 'bg-accent/5 border-transparent text-muted-foreground'
                          }`}
                        >
                          <Avatar className="h-8 w-8 border border-indigo-500/10">
                            <AvatarImage src={log.user?.avatarUrl} />
                            <AvatarFallback className="bg-accent text-muted-foreground text-xs font-bold">
                              {log.user?.name?.substring(0, 2).toUpperCase() || 'OP'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1 overflow-hidden">
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-bold text-foreground">{log.user?.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                              </span>
                            </div>
                            {isComment ? (
                              <p className="text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap mt-1">
                                {log.message}
                              </p>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <LogIcon className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                <span>{log.message}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {activities?.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground/60 py-4 italic">No activity logged yet.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
