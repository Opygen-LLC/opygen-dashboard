'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, Calendar, AlertTriangle, MessageSquare, Send, Trash2, Edit2, Loader2, ArrowRight, DollarSign, Smartphone, Globe, Plus, Check, CreditCard, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProjectForm from './ProjectForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';

interface ProjectDetailsProps {
  projectId: string;
  onClose: () => void;
}

export default function ProjectDetails({ projectId, onClose }: ProjectDetailsProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Payments states
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payType, setPayType] = useState<'advance' | 'frontend' | 'backend' | 'ui' | 'custom'>('advance');
  const [payLabel, setPayLabel] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payStatus, setPayStatus] = useState<'pending' | 'paid'>('pending');

  // Receipt upload states
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update project');
      }
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
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update project');
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
        <Button onClick={onClose} className="mt-4 h-10 cursor-pointer">Close</Button>
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
    low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-450 dark:border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-450 dark:border-orange-500/20',
    urgent: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20 animate-pulse',
  };

  const statusLabels: Record<string, string> = {
    potential: 'Potential',
    future: 'Future',
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
            Updated {format(new Date(project.updatedAt), 'MMM dd, HH:mm')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground h-10 w-10 cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
                title="Edit Project"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
                disabled={deleteMutation.isPending}
                title="Delete Project"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground h-10 w-10 cursor-pointer">
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
              isDrawer={true}
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
                  <SelectTrigger className="bg-background border-border text-foreground h-10 cursor-pointer">
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
                  <SelectTrigger className="bg-background border-border text-foreground h-10 cursor-pointer">
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

            {/* Date, Budget, and Assignees info */}
            <div className="space-y-4 border-b border-border/60 pb-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-455 shrink-0" />
                  <span>Start Date:</span>
                  <span className="font-semibold text-foreground">
                    {project.startDate ? format(new Date(project.startDate), 'PPP') : 'Not set'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-455 shrink-0" />
                  <span>Due Date:</span>
                  <span className="font-bold text-foreground">
                    {project.dueDate ? format(new Date(project.dueDate), 'PPP') : 'No due date set'}
                  </span>
                  {project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'completed' && (
                    <Badge variant="destructive" className="ml-2 text-[10px] py-0 px-1.5 font-bold uppercase animate-pulse">
                      Overdue
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450 shrink-0" />
                  <span>Budget:</span>
                  <span className="font-bold text-emerald-650 dark:text-emerald-450">
                    {['potential', 'future'].includes(project.status) ? (
                      project.budgetMin !== undefined && project.budgetMax !== undefined ? (
                        `$${Number(project.budgetMin).toLocaleString()} - $${Number(project.budgetMax).toLocaleString()}`
                      ) : project.budgetMin !== undefined ? (
                        `Min: $${Number(project.budgetMin).toLocaleString()}`
                      ) : project.budgetMax !== undefined ? (
                        `Max: $${Number(project.budgetMax).toLocaleString()}`
                      ) : (
                        '$0 (Range not set)'
                      )
                    ) : (
                      project.budget !== undefined && project.budget !== null
                        ? `$${Number(project.budget).toLocaleString()}`
                        : '$0'
                    )}
                  </span>
                </div>
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

            {/* Client Details Card */}
            <div className="p-4 rounded-lg bg-accent/25 dark:bg-card border border-border space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client Details</h4>
              {project.clientName ? (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-foreground">{project.clientName}</div>
                  
                  <div className="flex flex-wrap gap-4 text-xs mt-1">
                    {project.clientMobile && (
                      <a
                        href={`tel:${project.clientMobile}`}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-indigo-500 hover:underline transition-colors"
                      >
                        <Smartphone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>{project.clientMobile}</span>
                      </a>
                    )}
                    
                    {project.clientSocialLink && (
                      <a
                        href={project.clientSocialLink.startsWith('http') ? project.clientSocialLink : `https://${project.clientSocialLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-indigo-500 hover:underline transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{project.clientSocialLink}</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  No customer details specified for this project.
                </div>
              )}
            </div>

            {/* Payment Milestones Tracker */}
            <div className="p-4 rounded-lg bg-accent/15 dark:bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                  Payment Milestones
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPayment(!showAddPayment)}
                  className="h-7 text-xs border-border px-2 flex items-center gap-1 cursor-pointer"
                >
                  {showAddPayment ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {showAddPayment ? 'Cancel' : 'Add Milestone'}
                </Button>
              </div>

              {/* Progress Bar */}
              {(() => {
                const list = project.payments || [];
                const totalPaid = list.reduce((sum: number, p: any) => p.status === 'paid' ? sum + Number(p.amount) : sum, 0);
                const totalContract = list.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                const percent = totalContract > 0 ? Math.min(100, Math.round((totalPaid / totalContract) * 100)) : 0;

                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Received: <strong className="text-emerald-650 dark:text-emerald-450">${totalPaid.toLocaleString()}</strong></span>
                      <span>Total Milestones: <strong>${totalContract.toLocaleString()}</strong></span>
                    </div>
                    <div className="w-full bg-accent dark:bg-accent/40 rounded-full h-2 overflow-hidden border border-border/40">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground/80 font-bold">
                      {percent}% Paid
                    </div>
                  </div>
                );
              })()}

              {/* Add Payment Form */}
              {showAddPayment && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!payAmount || Number(payAmount) <= 0) {
                      toast.error('Please enter a valid amount');
                      return;
                    }
                    const totalPayments = (project.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0) + Number(payAmount);
                    if (totalPayments > (project.budget || 0)) {
                      toast.error(`Total payment milestones ($${totalPayments.toLocaleString()}) cannot exceed the project budget ($${(project.budget || 0).toLocaleString()})`);
                      return;
                    }
                    const newPay = {
                      type: payType,
                      customLabel: payType === 'custom' ? payLabel : '',
                      amount: Number(payAmount),
                      status: payStatus,
                      paymentDate: new Date().toISOString(),
                      receiptUrl: receiptFile || undefined,
                    };
                    const updated = [...(project.payments || []), newPay];
                    updateMutation.mutate({ payments: updated });
                    setPayAmount('');
                    setPayLabel('');
                    setPayType('advance');
                    setPayStatus('pending');
                    setReceiptFile(null);
                    setShowAddPayment(false);
                  }}
                  className="bg-background dark:bg-accent/10 border border-border/80 rounded-lg p-3 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Milestone Type</label>
                      <select
                        value={payType}
                        onChange={(e) => setPayType(e.target.value as any)}
                        className="w-full h-8 px-2 rounded border border-border bg-background text-xs text-foreground focus:outline-none"
                      >
                        <option value="advance">Advance</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="ui">UI/UX Design</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Amount ($)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full h-8 px-2 rounded border border-border bg-background text-xs text-foreground focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {payType === 'custom' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Custom Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Deployment bonus"
                        value={payLabel}
                        onChange={(e) => setPayLabel(e.target.value)}
                        className="w-full h-8 px-2 rounded border border-border bg-background text-xs text-foreground focus:outline-none"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      Receipt Image (Optional)
                      {uploadingReceipt && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setUploadingReceipt(true);
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const base64 = reader.result as string;
                          try {
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ image: base64 }),
                            });
                            if (!res.ok) throw new Error('Upload failed');
                            const uploadData = await res.json();
                            setReceiptFile(uploadData.url);
                            toast.success('Receipt uploaded to Cloudinary');
                          } catch (err) {
                            toast.error('Failed to upload receipt image');
                          } finally {
                            setUploadingReceipt(false);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-indigo-500/15 file:text-indigo-600 dark:file:text-indigo-400 file:cursor-pointer bg-background dark:bg-card border border-border h-8 flex items-center px-1"
                    />
                    {receiptFile && (
                      <div className="flex items-center gap-2 mt-1.5 p-1 rounded bg-accent/40 border border-border/50 w-fit">
                        <Image src={receiptFile} className="object-cover rounded border border-border/80" alt="Receipt preview" width={28} height={28} />
                        <span className="text-[9px] text-muted-foreground">Receipt ready</span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setReceiptFile(null)}
                          className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="payStatusCheck"
                        checked={payStatus === 'paid'}
                        onChange={(e) => setPayStatus(e.target.checked ? 'paid' : 'pending')}
                        className="rounded border-border text-indigo-600 h-3.5 w-3.5"
                      />
                      <label htmlFor="payStatusCheck" className="text-xs text-muted-foreground select-none cursor-pointer">
                        Mark as Paid immediately
                      </label>
                    </div>
                    <Button type="submit" disabled={uploadingReceipt} size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-600 text-white px-3 cursor-pointer">
                      Save Milestone
                    </Button>
                  </div>
                </form>
              )}

              {/* Payments List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {(project.payments || []).map((pay: any, index: number) => {
                  const typeLabels: Record<string, string> = {
                    advance: 'Advance',
                    frontend: 'Frontend Delivery',
                    backend: 'Backend Delivery',
                    ui: 'UI/UX Design',
                  };
                  const label = pay.type === 'custom' ? (pay.customLabel || 'Custom Milestone') : typeLabels[pay.type];

                  return (
                    <div
                      key={pay._id || index}
                      className="flex items-center justify-between border border-border bg-background dark:bg-accent/5 rounded-md p-2.5 hover:bg-accent/20 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="text-xs font-bold text-foreground truncate">{label}</div>
                        {pay.paymentDate && (
                          <div className="text-[10px] text-muted-foreground">
                            {format(new Date(pay.paymentDate), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {pay.receiptUrl && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewReceiptUrl(pay.receiptUrl);
                            }}
                            className="h-8 w-8 rounded border border-border bg-background overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors shadow-xs group shrink-0 relative"
                            title="Click to view receipt"
                          >
                            <Image src={pay.receiptUrl} className="object-cover group-hover:scale-110 transition-transform" alt="Receipt thumbnail" width={32} height={32} />
                          </div>
                        )}
                        <div className="text-xs font-bold text-foreground">
                          ${Number(pay.amount).toLocaleString()}
                        </div>
                        <Badge
                          onClick={() => {
                            const updated = (project.payments || []).map((p: any, idx: number) =>
                              idx === index ? { ...p, status: p.status === 'paid' ? 'pending' : 'paid' } : p
                            );
                            updateMutation.mutate({ payments: updated });
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors border select-none ${
                            pay.status === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-450'
                          }`}
                        >
                          {pay.status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this payment milestone?')) {
                              const updated = (project.payments || []).filter((_: any, idx: number) => idx !== index);
                              updateMutation.mutate({ payments: updated });
                            }
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {(project.payments || []).length === 0 && (
                  <div className="text-center text-xs text-muted-foreground/60 py-4 italic">
                    No payment milestones set.
                  </div>
                )}
              </div>
            </div>

            {/* Activity Logs & Comments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <MessageSquare className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 self-end mb-1 mr-1 h-10 w-10 cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
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

      {/* Receipt Image Preview Dialog */}
      <Dialog open={!!previewReceiptUrl} onOpenChange={(open) => !open && setPreviewReceiptUrl(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl p-4 flex flex-col items-center justify-center">
          <div className="flex justify-between items-center w-full border-b border-border pb-2 mb-3">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <FileImage className="h-4 w-4 text-indigo-500" />
              Payment Receipt Preview
            </h3>
          </div>
          {previewReceiptUrl && (
            <Image src={previewReceiptUrl} className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg border border-border shadow-md" alt="Receipt Full View" width={800} height={600} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
