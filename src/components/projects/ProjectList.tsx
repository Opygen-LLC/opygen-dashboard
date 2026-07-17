'use client';

import React from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ProjectListProps {
  projects: any[];
  onProjectClick: (id: string) => void;
  onEditClick: (project: any, e: React.MouseEvent) => void;
}

export default function ProjectList({ projects, onProjectClick, onEditClick }: ProjectListProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Project deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete project');
    },
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20',
    medium: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-450 dark:border-yellow-500/20',
    high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-450 dark:border-orange-500/20',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20 animate-pulse',
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
    in_progress: 'bg-indigo-50 text-indigo-750 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    in_review: 'bg-purple-50 text-purple-750 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    on_hold: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-450 dark:border-yellow-500/20',
  };

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    completed: 'Completed',
    on_hold: 'On Hold',
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl bg-accent/5">
        <p className="text-sm text-muted-foreground italic">No projects found matching the filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/30 dark:bg-slate-900/10 overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-accent/40 border-b border-border">
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead className="text-muted-foreground font-bold">Title</TableHead>
            <TableHead className="text-muted-foreground font-bold w-24">Priority</TableHead>
            <TableHead className="text-muted-foreground font-bold w-32">Status</TableHead>
            <TableHead className="text-muted-foreground font-bold w-40">Assignees</TableHead>
            <TableHead className="text-muted-foreground font-bold w-36">Due Date</TableHead>
            <TableHead className="text-muted-foreground font-bold w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'completed';

            return (
              <TableRow
                key={project._id}
                onClick={() => onProjectClick(project._id)}
                className="cursor-pointer border-b border-border/60 hover:bg-accent/30 transition-colors"
              >
                <TableCell className="font-bold text-foreground">
                  <div className="truncate max-w-[300px] md:max-w-[400px]">
                    {project.title}
                  </div>
                  {project.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-[300px] md:max-w-[400px] mt-1.5 font-normal leading-relaxed">
                      {project.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`capitalize border text-[10px] ${priorityColors[project.priority]}`}>
                    {project.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`capitalize border text-[10px] ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {project.assignees.slice(0, 4).map((user: any, i: number) => (
                      <Avatar
                        key={user._id}
                        className="h-6 w-6 border-2 border-background ring-0 shrink-0 transition-transform duration-200 hover:translate-y-[-2px]"
                        style={{ zIndex: 4 - i }}
                      >
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="bg-accent text-[10px] text-muted-foreground font-bold">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.assignees.length > 4 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-accent text-[9px] font-bold text-muted-foreground shrink-0 transition-transform duration-200 hover:translate-y-[-2px]">
                        +{project.assignees.length - 4}
                      </div>
                    )}
                    {project.assignees.length === 0 && (
                      <span className="text-[10px] text-muted-foreground/60 italic">Unassigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className={`h-3.5 w-3.5 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <span className={isOverdue ? 'text-destructive font-bold' : ''}>
                      {project.dueDate ? format(new Date(project.dueDate), 'MMM dd, yyyy') : 'No due date'}
                    </span>
                    {isOverdue && (
                      <AlertCircle className="h-3 w-3 text-destructive shrink-0 animate-pulse" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => onEditClick(project, e)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                      title="Edit project"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(project._id, e)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={deleteMutation.isPending}
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
