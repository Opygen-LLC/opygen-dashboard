'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import KanbanBoard from '@/components/projects/KanbanBoard';
import ProjectList from '@/components/projects/ProjectList';
import ProjectForm from '@/components/projects/ProjectForm';
import ProjectDetails from '@/components/projects/ProjectDetails';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [defaultCreateStatus, setDefaultCreateStatus] = useState<string>('todo');
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: users } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  const getFilterParams = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search);
    if (status !== 'all') params.append('status', status);
    if (priority !== 'all') params.append('priority', priority);
    if (assignee !== 'all') params.append('assignee', assignee);
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    return params.toString();
  };

  const { data: projects = [], isLoading } = useQuery<any[]>({
    queryKey: ['projects', search, status, priority, assignee, sortBy, sortOrder],
    queryFn: async () => {
      const params = getFilterParams();
      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newProject: any) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsCreateOpen(false);
      toast.success('Project created successfully');
    },
    onError: () => {
      toast.error('Failed to create project');
    },
  });

  const handleAddProject = (statusValue: string) => {
    setDefaultCreateStatus(statusValue);
    setIsCreateOpen(true);
  };

  const handleEditClick = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectId(project._id);
  };

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden relative">
      {/* Title + Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, update, and manage Opygen team projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-border bg-accent/40 p-1 shrink-0">
            <Button
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('board')}
              className="h-8 gap-1.5 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Board</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 gap-1.5 px-3"
            >
              <ListIcon className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>

          <Button
            onClick={() => handleAddProject('todo')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 h-9 shrink-0 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-accent/15 p-4 rounded-xl border border-border/80">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9 bg-background border-border focus-visible:ring-indigo-500 text-foreground h-9"
          />
        </div>

        <div>
          <Select value={status} onValueChange={(val) => setStatus(val || 'all')}>
            <SelectTrigger className="bg-background border-border text-foreground h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={priority} onValueChange={(val) => setPriority(val || 'all')}>
            <SelectTrigger className="bg-background border-border text-foreground h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={assignee} onValueChange={(val) => setAssignee(val || 'all')}>
            <SelectTrigger className="bg-background border-border text-foreground h-9">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Assignees</SelectItem>
              {users?.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'updatedAt')}>
            <SelectTrigger className="bg-background border-border text-foreground h-9 flex-1">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="updatedAt">Recently Updated</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="title">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="h-9 w-9 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Display Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-accent/5">
            <FolderOpen className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-base font-bold text-muted-foreground">No projects found</h3>
            <p className="text-sm text-muted-foreground/80 mt-1">Try relaxing your filters or create a new project.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('all');
                setPriority('all');
                setAssignee('all');
              }}
              className="mt-4 border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === 'board' ? (
          <KanbanBoard
            projects={projects}
            onProjectClick={setSelectedProjectId}
            onAddProject={handleAddProject}
          />
        ) : (
          <ProjectList
            projects={projects}
            onProjectClick={setSelectedProjectId}
            onEditClick={handleEditClick}
          />
        )}
      </div>

      {/* Project Creation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Scaffold a new project card for Opygen. Fill in the fields below.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            initialData={{ status: defaultCreateStatus as any }}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Slide-out Project Details Panel */}
      <AnimatePresence>
        {selectedProjectId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProjectId(null)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg"
            >
              <ProjectDetails
                projectId={selectedProjectId}
                onClose={() => setSelectedProjectId(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
