'use client';

import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectCardProps {
  project: any;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function ProjectCard({ project, onClick, draggable, onDragStart }: ProjectCardProps) {
  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'completed';

  const priorityColors: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20',
    medium: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-450 dark:border-yellow-500/20',
    high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-450 dark:border-orange-500/20',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20 animate-pulse',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    todo: <Clock className="h-3 w-3 text-muted-foreground" />,
    in_progress: <Clock className="h-3 w-3 animate-spin text-indigo-500 dark:text-indigo-400" />,
    in_review: <Clock className="h-3 w-3 text-purple-500 dark:text-purple-400" />,
    completed: <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />,
    on_hold: <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />,
  };

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    completed: 'Completed',
    on_hold: 'On Hold',
  };

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className={`cursor-pointer ${draggable ? 'active:cursor-grabbing' : ''}`}
    >
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card className="border-border bg-card/60 hover:bg-card/90 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 transition-all duration-200 shadow-sm hover:shadow-md text-card-foreground">
          <CardHeader className="p-4 pb-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Badge className={`capitalize border text-[10px] px-1.5 py-0 ${priorityColors[project.priority]}`}>
                {project.priority}
              </Badge>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-accent/30 rounded-full px-2 py-0.5 border border-border/40">
                {statusIcons[project.status]}
                <span>{statusLabels[project.status]}</span>
              </div>
            </div>
            <CardTitle className="text-sm font-bold line-clamp-2 text-foreground group-hover:text-indigo-500 transition-colors leading-snug">
              {project.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 pt-1 pb-3">
            {project.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                {project.description}
              </p>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-border/40 mt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar className={`h-3 w-3 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                {project.dueDate ? format(new Date(project.dueDate), 'MMM dd') : 'No due date'}
              </span>
            </div>

            <div className="flex -space-x-1.5 overflow-hidden">
              {project.assignees.slice(0, 3).map((user: any, i: number) => (
                <Avatar key={user._id} className="h-6 w-6 border-2 border-background ring-0 shrink-0 transition-transform duration-200 hover:translate-y-[-2px]" style={{ zIndex: 3 - i }}>
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-accent text-[10px] text-muted-foreground font-bold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.assignees.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-accent text-[9px] font-bold text-muted-foreground shrink-0 z-[0] transition-transform duration-200 hover:translate-y-[-2px]">
                  +{project.assignees.length - 3}
                </div>
              )}
              {project.assignees.length === 0 && (
                <span className="text-[10px] text-muted-foreground/60 italic">Unassigned</span>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
