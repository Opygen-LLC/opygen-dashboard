"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loading } from "../ui/Loading";

interface ClientToQuoteModalProps {
    client: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ClientToQuoteModal({
    client,
    isOpen,
    onClose,
}: ClientToQuoteModalProps) {
    const queryClient = useQueryClient();
    const [cachedClient, setCachedClient] = React.useState(client);

    React.useEffect(() => {
        if (client) setCachedClient(client);
    }, [client]);

    const activeClient = client ?? cachedClient;

    const [projectName, setProjectName] = useState(activeClient?.name ? `${activeClient.name} - Project` : "");
    const [projectDetails, setProjectDetails] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [projectDuration, setProjectDuration] = useState("");
    const [minBudget, setMinBudget] = useState<number | "">(activeClient?.minAmount || "");
    const [maxBudget, setMaxBudget] = useState<number | "">(activeClient?.maxAmount || "");

    // Update state when activeClient changes
    React.useEffect(() => {
        if (activeClient) {
            setProjectName(`${activeClient.name} - Project`);
            setMinBudget(activeClient.minAmount || "");
            setMaxBudget(activeClient.maxAmount || "");
        }
    }, [activeClient]);

    const createQuoteMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/admin/quotes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to create quote");
            }
            return res.json();
        },
        onSuccess: async () => {
            toast.success("Quote created successfully from client!");
            queryClient.invalidateQueries({ queryKey: ["quotes"] });

            // Update the originating client's status to "Follow-up" or "Confirmed"
            if (activeClient?._id) {
                try {
                    const res = await fetch(`/api/clients/${activeClient._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "Follow-up" }),
                    });
                    if (res.ok) {
                        queryClient.invalidateQueries({ queryKey: ["clients"] });
                    }
                } catch {
                    // Non-blocking
                }
            }

            onClose();
        },
        onError: (err: any) => toast.error(err.message),
    });

    if (!activeClient) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!projectName.trim() || !projectDuration.trim()) {
            toast.error("Please fill in the required fields");
            return;
        }

        const payload = {
            projectName,
            projectDetails,
            clientName: activeClient.name || "Unknown Client",
            clientPhone: activeClient.number || "",
            clientSocialLink: activeClient.socialMediaLink || "",
            currency,
            advanceType: "percentage",
            advanceValue: 0,
            projectDuration,
            phases: [
                {
                    phaseName: "Initial Phase",
                    description: "Initial project phase based on client discussion",
                    minBudget: minBudget ? Number(minBudget) : 0,
                    maxBudget: maxBudget ? Number(maxBudget) : 0,
                }
            ],
            paymentAccount: null
        };

        createQuoteMutation.mutate(payload);
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-w-4xl bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="px-6 py-5 border-b border-border bg-muted/20">
                    <DialogTitle className="text-2xl font-bold bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        Convert Client to Quote
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-1">
                        Create a quick quote for {activeClient.name}. You can add more details later in the Quotes section.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Project Name *</label>
                            <Input 
                                value={projectName} 
                                onChange={(e) => setProjectName(e.target.value)} 
                                placeholder="e.g. Website Redesign" 
                                className="h-10 border-border focus-visible:ring-indigo-500" 
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Project Duration *</label>
                            <Input 
                                value={projectDuration} 
                                onChange={(e) => setProjectDuration(e.target.value)} 
                                placeholder="e.g. 2 Weeks" 
                                className="h-10 border-border focus-visible:ring-indigo-500" 
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Project Details</label>
                        <Textarea 
                            value={projectDetails} 
                            onChange={(e) => setProjectDetails(e.target.value)} 
                            placeholder="Brief details about the project..." 
                            className="resize-none h-20 border-border focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Currency</label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger className="w-full h-10 border-border focus-visible:ring-indigo-500">
                                    <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="BDT">BDT (৳)</SelectItem>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Min Budget</label>
                            <Input 
                                type="number" 
                                value={minBudget} 
                                onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : "")} 
                                placeholder="e.g. 1000" 
                                className="h-10 border-border focus-visible:ring-indigo-500" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Max Budget</label>
                            <Input 
                                type="number" 
                                value={maxBudget} 
                                onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : "")} 
                                placeholder="e.g. 2000" 
                                className="h-10 border-border focus-visible:ring-indigo-500" 
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createQuoteMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 min-w-32"
                        >
                            {createQuoteMutation.isPending ? <Loading variant="mini" /> : "Create Quote"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
