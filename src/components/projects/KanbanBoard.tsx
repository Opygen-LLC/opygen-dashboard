'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import ProjectCard from './ProjectCard';

interface KanbanBoardProps {
  projects: any[];
  onProjectClick: (id: string) => void;
  onAddProject: (status: string) => void;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'completed', title: 'Completed' },
  { id: 'on_hold', title: 'On Hold' },
];

export default function KanbanBoard({ projects, onProjectClick, onAddProject }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['project', data._id] });
      queryClient.invalidateQueries({ queryKey: ['activities', data._id] });
      toast.success(`Moved to "${COLUMNS.find((c) => c.id === data.status)?.title}"`);
    },
    onError: () => {
      toast.error('Failed to move project');
    },
  });

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('text/plain', projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverCol !== columnId) {
      setDragOverCol(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const projectId = e.dataTransfer.getData('text/plain');
    if (!projectId) return;

    const project = projects.find((p) => p._id === projectId);
    if (project && project.status !== columnId) {
      updateStatusMutation.mutate({ id: projectId, status: columnId });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full items-start overflow-x-auto min-w-[1000px] md:min-w-0 pb-4">
      {COLUMNS.map((column) => {
        const columnProjects = projects.filter((p) => p.status === column.id);
        const isOver = dragOverCol === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col rounded-xl bg-accent/20 dark:bg-slate-900/20 border border-border/80 p-4 min-h-[550px] transition-colors duration-200 ${
              isOver ? 'bg-indigo-500/5 dark:bg-indigo-950/10 border-indigo-500/30 dark:border-indigo-500/20 ring-1 ring-indigo-500/20 shadow-xs' : ''
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    column.id === 'todo'
                      ? 'bg-slate-400 dark:bg-slate-500'
                      : column.id === 'in_progress'
                      ? 'bg-indigo-500 dark:bg-indigo-400'
                      : column.id === 'in_review'
                      ? 'bg-purple-500 dark:bg-purple-400'
                      : column.id === 'completed'
                      ? 'bg-emerald-500 dark:bg-emerald-400'
                      : 'bg-yellow-600 dark:bg-yellow-500'
                  }`}
                />
                <h3 className="text-sm font-bold text-foreground">{column.title}</h3>
                <span className="text-[11px] font-semibold text-muted-foreground bg-accent/60 px-2 py-0.5 rounded-full border border-border/40">
                  {columnProjects.length}
                </span>
              </div>
              <button
                onClick={() => onAddProject(column.id)}
                className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 p-1 hover:bg-accent rounded-md transition-colors"
                title={`Add project to ${column.title}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {columnProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onClick={() => onProjectClick(project._id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, project._id)}
                />
              ))}

              {columnProjects.length === 0 && (
                <div className="border border-dashed border-border rounded-xl py-12 text-center text-xs text-muted-foreground/60">
                  Drop projects here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
