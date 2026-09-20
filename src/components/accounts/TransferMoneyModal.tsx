"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    X,
    ArrowLeftRight,
    Landmark,
    Smartphone,
    Wallet,
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Calendar,
    FileText,
    HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TransferMoneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedAccount?: {
        _id?: string;
        userId?: string;
        userName?: string;
        userEmail?: string;
        providerName?: string;
        accountName?: string;
        accountNumber?: string;
        type?: string;
        balance?: number;
        balanceInBdt?: number;
    } | null;
}

export default function TransferMoneyModal({
    isOpen,
    onClose,
    preselectedAccount,
}: TransferMoneyModalProps) {
    const queryClient = useQueryClient();

    const [fromAccountId, setFromAccountId] = useState<string>("");
    const [toAccountId, setToAccountId] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [fee, setFee] = useState<string>("0");
    const [date, setDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [note, setNote] = useState<string>("");

    // Fetch all accounts for dropdown selection
    const { data: accountsData, isLoading: isAccountsLoading } = useQuery({
        queryKey: ["all-accounts-for-transfer"],
        queryFn: async () => {
            const res = await fetch("/api/admin/accounts?limit=1000");
            if (!res.ok) throw new Error("Failed to load accounts");
            return res.json();
        },
        enabled: isOpen,
    });

    const accountsList: any[] = accountsData?.accounts || [];

    // Pre-populate source account if preselectedAccount provided
    useEffect(() => {
        if (isOpen) {
            if (preselectedAccount?._id) {
                setFromAccountId(preselectedAccount._id);
            } else {
                setFromAccountId("");
            }
            setToAccountId("");
            setAmount("");
            setFee("0");
            setDate(new Date().toISOString().split("T")[0]);
            setNote("");
        }
    }, [isOpen, preselectedAccount]);

    const fromAccountItem = accountsList.find(
        (item: any) => item.account?._id?.toString() === fromAccountId
    );
    const toAccountItem = accountsList.find(
        (item: any) => item.account?._id?.toString() === toAccountId
    );

    const fromBalance = Number(
        fromAccountItem?.account?.balanceInBdt ??
            fromAccountItem?.account?.balance ??
            0
    );
    const toBalance = Number(
        toAccountItem?.account?.balanceInBdt ??
            toAccountItem?.account?.balance ??
            0
    );

    const numAmount = Math.max(0, parseFloat(amount) || 0);
    const numFee = Math.max(0, parseFloat(fee) || 0);
    const totalDeduction = numAmount + numFee;
    const isInsufficientBalance = Boolean(fromAccountId && totalDeduction > fromBalance);

    const transferMutation = useMutation({
        mutationFn: async (payload: {
            fromUserId: string;
            fromAccountId: string;
            toUserId: string;
            toAccountId: string;
            amount: number;
            fee: number;
            date?: string;
            note?: string;
        }) => {
            const res = await fetch("/api/admin/accounts/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Transfer failed");
            }
            return data;
        },
        onSuccess: (data) => {
            toast.success(
                data.message || "Money transferred successfully!",
                { duration: 5000 }
            );
            // Invalidate queries so tables and history update immediately
            queryClient.invalidateQueries({ queryKey: ["adminAccounts"] });
            queryClient.invalidateQueries({
                queryKey: ["all-finance-accounts"],
            });
            queryClient.invalidateQueries({
                queryKey: ["all-accounts-for-transfer"],
            });
            queryClient.invalidateQueries({ queryKey: ["account-history"] });
            queryClient.invalidateQueries({
                queryKey: ["finance-transactions"],
            });
            queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to transfer money");
        },
    });

    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();

        if (!fromAccountId) {
            toast.error("Please select a source (sender) account");
            return;
        }
        if (!toAccountId) {
            toast.error("Please select a destination (receiver) account");
            return;
        }
        if (fromAccountId === toAccountId) {
            toast.error("Source and destination accounts must be different");
            return;
        }
        if (numAmount <= 0) {
            toast.error("Please enter a valid transfer amount greater than 0");
            return;
        }
        if (isInsufficientBalance) {
            toast.error(
                `Insufficient balance in source account! Available: ৳${fromBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Total Required: ৳${totalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            );
            return;
        }

        if (!fromAccountItem?.userId || !toAccountItem?.userId) {
            toast.error("Invalid account owner information");
            return;
        }

        transferMutation.mutate({
            fromUserId: fromAccountItem.userId.toString(),
            fromAccountId,
            toUserId: toAccountItem.userId.toString(),
            toAccountId,
            amount: numAmount,
            fee: numFee,
            date,
            note: note.trim() || undefined,
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-2xl max-h-[92vh] flex flex-col border border-border bg-card shadow-2xl rounded-2xl overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                                <ArrowLeftRight className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">
                                    Transfer Money Between Accounts
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Transfer funds between linked bank or mobile
                                    accounts with fee support.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Form Container */}
                    <form
                        onSubmit={handleTransfer}
                        className="overflow-y-auto flex-1 p-6 space-y-5"
                    >
                        {/* 1. Account Selectors (From -> To) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Source Account */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                    <span>
                                        From Account (Sender){" "}
                                        <span className="text-rose-500">*</span>
                                    </span>
                                </Label>
                                <Select
                                    value={fromAccountId}
                                    onValueChange={(val: any) => {
                                        const strVal = typeof val === "string" ? val : "";
                                        setFromAccountId(strVal);
                                        if (strVal === toAccountId) {
                                            setToAccountId("");
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full h-11 bg-background border-border text-foreground">
                                        <SelectValue placeholder="-- Select Sender Account --" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[160] max-h-64">
                                        {accountsList.map((item: any) => {
                                            const acc = item.account;
                                            return (
                                                <SelectItem
                                                    key={acc._id}
                                                    value={acc._id}
                                                    className="h-12 py-2"
                                                >
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-semibold text-xs text-foreground">
                                                            {acc.providerName} •{" "}
                                                            {acc.accountNumber}{" "}
                                                            ({item.userName})
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {acc.accountName} |
                                                            Bal: ৳
                                                            {Number(
                                                                acc.balanceInBdt ??
                                                                    acc.balance ??
                                                                    0
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>

                                {fromAccountItem && (
                                    <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                {fromAccountItem.account.type ===
                                                "bank" ? (
                                                    <Landmark className="h-3.5 w-3.5 text-indigo-500" />
                                                ) : (
                                                    <Smartphone className="h-3.5 w-3.5 text-indigo-500" />
                                                )}
                                                {fromAccountItem.account.providerName}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] h-4 px-1.5"
                                            >
                                                {fromAccountItem.userName}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                            <span>
                                                {fromAccountItem.account.accountNumber}
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                Available: ৳
                                                {fromBalance.toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Destination Account */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                    <span>
                                        To Account (Receiver){" "}
                                        <span className="text-rose-500">*</span>
                                    </span>
                                </Label>
                                <Select
                                    value={toAccountId}
                                    onValueChange={(val: any) => setToAccountId(typeof val === "string" ? val : "")}
                                    disabled={!fromAccountId}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            "w-full h-11 bg-background border-border text-foreground",
                                            !fromAccountId && "opacity-60 cursor-not-allowed"
                                        )}
                                    >
                                        <SelectValue
                                            placeholder={
                                                fromAccountId
                                                    ? "-- Select Receiver Account --"
                                                    : "Select Sender first"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="z-[160] max-h-64">
                                        {accountsList
                                            .filter(
                                                (item: any) =>
                                                    item.account?._id?.toString() !==
                                                    fromAccountId
                                            )
                                            .map((item: any) => {
                                                const acc = item.account;
                                                return (
                                                    <SelectItem
                                                        key={acc._id}
                                                        value={acc._id}
                                                        className="h-12 py-2"
                                                    >
                                                        <div className="flex flex-col text-left">
                                                            <span className="font-semibold text-xs text-foreground">
                                                                {acc.providerName} •{" "}
                                                                {acc.accountNumber}{" "}
                                                                ({item.userName})
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {acc.accountName} |
                                                                Bal: ৳
                                                                {Number(
                                                                    acc.balanceInBdt ??
                                                                        acc.balance ??
                                                                        0
                                                                ).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                    </SelectContent>
                                </Select>

                                {toAccountItem && (
                                    <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                {toAccountItem.account.type ===
                                                "bank" ? (
                                                    <Landmark className="h-3.5 w-3.5 text-indigo-500" />
                                                ) : (
                                                    <Smartphone className="h-3.5 w-3.5 text-indigo-500" />
                                                )}
                                                {toAccountItem.account.providerName}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] h-4 px-1.5"
                                            >
                                                {toAccountItem.userName}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                            <span>
                                                {toAccountItem.account.accountNumber}
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                Current: ৳
                                                {toBalance.toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Amount & Fee Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Transfer Amount */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                    <span>
                                        Transfer Amount (৳){" "}
                                        <span className="text-rose-500">*</span>
                                    </span>
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                                        ৳
                                    </span>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        placeholder="e.g. 10000"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
                                        className="pl-8 bg-background border-border h-11 text-foreground font-semibold text-base"
                                        required
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Amount that will be received in the receiver&apos;s
                                    account.
                                </p>
                            </div>

                            {/* Transfer Fee / Cost */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                    <span>Transfer Fee / Cost (৳)</span>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] font-normal"
                                    >
                                        Optional (0 or more)
                                    </Badge>
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                                        ৳
                                    </span>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="0"
                                        value={fee}
                                        onChange={(e) =>
                                            setFee(e.target.value)
                                        }
                                        className="pl-8 bg-background border-border h-11 text-foreground font-medium"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Charge incurred for transfer (e.g. ৳10).
                                    Deducted from sender.
                                </p>
                            </div>
                        </div>

                        {/* 3. Date & Note */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                    Transfer Date
                                </Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-background border-border h-10 text-foreground"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                    Reference Note (Optional)
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Office fund transfer, Cash-in"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    maxLength={300}
                                    className="bg-background border-border h-10 text-foreground text-sm"
                                />
                            </div>
                        </div>

                        {/* 4. Live Summary & Calculation Card */}
                        {numAmount > 0 && fromAccountItem && toAccountItem && (
                            <div
                                className={cn(
                                    "p-4 rounded-xl border transition-all space-y-3",
                                    isInsufficientBalance
                                        ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                                        : "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/20 text-foreground"
                                )}
                            >
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5">
                                        <Wallet className="h-4 w-4 text-indigo-500" />
                                        Transfer Breakdown
                                    </span>
                                    {numFee > 0 ? (
                                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                                            Fee: ৳{numFee.toLocaleString()}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                                            No Fee (Free)
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                                    {/* Sender Details */}
                                    <div className="p-2.5 bg-background/80 rounded-lg border border-border space-y-1">
                                        <p className="text-[11px] text-muted-foreground font-medium">
                                            Sender:{" "}
                                            <span className="text-foreground font-semibold">
                                                {fromAccountItem.account.providerName}
                                            </span>
                                        </p>
                                        <div className="flex items-center justify-between pt-0.5">
                                            <span className="text-muted-foreground">
                                                Total Deducted:
                                            </span>
                                            <span className="font-bold text-rose-600 dark:text-rose-400">
                                                -৳
                                                {totalDeduction.toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span>Projected Balance:</span>
                                            <span
                                                className={cn(
                                                    "font-semibold",
                                                    isInsufficientBalance
                                                        ? "text-rose-500"
                                                        : "text-foreground"
                                                )}
                                            >
                                                ৳
                                                {(
                                                    fromBalance - totalDeduction
                                                ).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Receiver Details */}
                                    <div className="p-2.5 bg-background/80 rounded-lg border border-border space-y-1">
                                        <p className="text-[11px] text-muted-foreground font-medium">
                                            Receiver:{" "}
                                            <span className="text-foreground font-semibold">
                                                {toAccountItem.account.providerName}
                                            </span>
                                        </p>
                                        <div className="flex items-center justify-between pt-0.5">
                                            <span className="text-muted-foreground">
                                                Amount Received:
                                            </span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                +৳
                                                {numAmount.toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span>Projected Balance:</span>
                                            <span className="font-semibold text-foreground">
                                                ৳
                                                {(
                                                    toBalance + numAmount
                                                ).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isInsufficientBalance && (
                                    <div className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 pt-1 font-medium">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>
                                            Insufficient funds in sender account!
                                            Available balance is ৳
                                            {fromBalance.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                            })}
                                            , but ৳
                                            {totalDeduction.toLocaleString(
                                                undefined,
                                                { minimumFractionDigits: 2 }
                                            )}{" "}
                                            is required (including ৳
                                            {numFee.toLocaleString()} fee).
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="pt-2 border-t border-border flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={transferMutation.isPending}
                                className="h-10 px-5 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    transferMutation.isPending ||
                                    !fromAccountId ||
                                    !toAccountId ||
                                    numAmount <= 0 ||
                                    isInsufficientBalance
                                }
                                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer gap-2"
                            >
                                {transferMutation.isPending ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing Transfer...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowLeftRight className="h-4 w-4" />
                                        <span>Confirm Transfer</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
