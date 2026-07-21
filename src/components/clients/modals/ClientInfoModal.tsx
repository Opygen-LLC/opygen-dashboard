import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Globe, ExternalLink, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClientInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: any | null;
    onEdit: (client: any) => void;
}

export function ClientInfoModal({ isOpen, onClose, client, onEdit }: ClientInfoModalProps) {
    if (!client) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/60"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col ring-1 ring-white/10 dark:ring-white/5"
                    >
                        {/* Decorative Top Gradient */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        
                        {/* Header */}
                        <div className="relative flex items-center justify-between p-6 pb-4">
                            <div>
                                <h3 className="font-extrabold text-2xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Client Profile
                                </h3>
                                <p className="text-sm font-medium text-muted-foreground mt-1">
                                    Detailed view of client information and status
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted hover:text-foreground transition-colors"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content Grid */}
                        <div className="p-6 pt-2 space-y-6 max-h-[75vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
                            {/* Top Section: Identity */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-0.5">Primary Contact</h4>
                                            <p className="text-lg font-bold text-foreground">{client.name}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {client.companyName && (
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/10">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
                                                <FolderPlus className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-pink-600/70 dark:text-pink-400/70 uppercase tracking-wider mb-0.5">Company</h4>
                                                <p className="text-lg font-bold text-foreground">{client.companyName}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Middle Section: Contact & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-4 p-4 rounded-2xl border border-border/50 bg-muted/20">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="h-3.5 w-3.5" /> Contact Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Location</p>
                                            <p className="text-sm font-medium text-foreground">{client.country}</p>
                                        </div>
                                        {client.number && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Phone</p>
                                                <a 
                                                    href={`https://wa.me/${client.number.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-medium text-indigo-500 hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1.5 w-max"
                                                >
                                                    {client.number}
                                                </a>
                                            </div>
                                        )}
                                        {client.socialMediaLink && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Social Link</p>
                                                <a
                                                    href={client.socialMediaLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 w-fit"
                                                >
                                                    View Profile <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 rounded-2xl border border-border/50 bg-muted/20">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Edit className="h-3.5 w-3.5" /> Pipeline Status
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                                            <Badge variant="secondary" className="font-semibold">{client.status}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Acquisition Source</p>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-sm font-medium text-foreground">{client.source}</span>
                                                {client.source === "Other" && client.otherSource && (
                                                    <span className="text-xs text-muted-foreground">({client.otherSource})</span>
                                                )}
                                            </div>
                                        </div>
                                        {client.status === "Follow-up" && client.followupDate && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Scheduled Follow-up</p>
                                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 w-fit px-2 py-0.5 rounded-md">
                                                    {new Date(client.followupDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Financials & Notes */}
                            <div className="space-y-4 p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Estimated Deal Value
                                </h4>
                                <p className="text-2xl font-black text-foreground tracking-tight">
                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(client.minAmount || 0)} 
                                    <span className="text-muted-foreground font-medium text-xl mx-2">to</span> 
                                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(client.maxAmount || 0)}
                                </p>
                            </div>

                            {client.notes && (
                                <div className="space-y-2 p-4 rounded-2xl border border-border/50 bg-muted/10">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Additional Notes
                                    </h4>
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                        {client.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 px-6 border-t border-border/40 bg-accent/5 flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                className="border-border/50 hover:bg-muted font-semibold"
                                onClick={onClose}
                            >
                                Dismiss
                            </Button>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20"
                                onClick={() => {
                                    onClose();
                                    onEdit(client);
                                }}
                            >
                                Edit Client
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
