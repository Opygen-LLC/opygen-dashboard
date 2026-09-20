import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { accountTransferSchema } from "@/lib/validations";
import { TransactionType, TransactionCategory } from "@/types";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (
        !session ||
        (session.user.role !== "admin" &&
            (session.user.role as string) !== "superadmin")
    ) {
        return NextResponse.json(
            { error: "Unauthorized. Admin access required." },
            { status: 401 },
        );
    }

    try {
        await dbConnect();
        const body = await req.json();

        const parseResult = accountTransferSchema.safeParse(body);
        if (!parseResult.success) {
            const firstError = Object.values(
                parseResult.error.flatten().fieldErrors,
            )?.[0]?.[0];
            return NextResponse.json(
                { error: firstError || "Invalid transfer data", details: parseResult.error.flatten() },
                { status: 400 },
            );
        }

        const {
            fromUserId,
            fromAccountId,
            toUserId,
            toAccountId,
            amount: rawAmount,
            fee: rawFee,
            date,
            note,
        } = parseResult.data;

        const amount = Number(rawAmount);
        const fee = Number(rawFee || 0);
        const totalDeduction = amount + fee;

        if (amount <= 0) {
            return NextResponse.json(
                { error: "Transfer amount must be greater than 0" },
                { status: 400 },
            );
        }

        if (fee < 0) {
            return NextResponse.json(
                { error: "Transfer fee cannot be negative" },
                { status: 400 },
            );
        }

        // 1. Fetch Source User and Account
        const fromUser = await User.findById(fromUserId);
        if (!fromUser) {
            return NextResponse.json(
                { error: "Source user profile not found" },
                { status: 404 },
            );
        }

        const fromAccount = fromUser.accounts?.find(
            (a: any) => a._id?.toString() === fromAccountId,
        );
        if (!fromAccount) {
            return NextResponse.json(
                { error: "Source account not found on user profile" },
                { status: 404 },
            );
        }

        // 2. Fetch Destination User and Account
        const toUser =
            fromUserId === toUserId
                ? fromUser
                : await User.findById(toUserId);

        if (!toUser) {
            return NextResponse.json(
                { error: "Destination user profile not found" },
                { status: 404 },
            );
        }

        const toAccount = toUser.accounts?.find(
            (a: any) => a._id?.toString() === toAccountId,
        );
        if (!toAccount) {
            return NextResponse.json(
                { error: "Destination account not found on user profile" },
                { status: 404 },
            );
        }

        // 3. Balance Validation
        const currentSourceBalance = Number(
            fromAccount.balanceInBdt ?? fromAccount.balance ?? 0,
        );
        if (currentSourceBalance < totalDeduction) {
            return NextResponse.json(
                {
                    error: `Insufficient balance in "${fromAccount.providerName} (${fromAccount.accountNumber})". Available: ৳${currentSourceBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Required: ৳${totalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Transfer: ৳${amount.toLocaleString()} + Fee: ৳${fee.toLocaleString()}).`,
                },
                { status: 400 },
            );
        }

        // 4. Update Account Balances
        if (fromUserId === toUserId) {
            // Both accounts belong to the same user
            await User.updateOne(
                { _id: fromUserId },
                {
                    $inc: {
                        "accounts.$[src].balance": -totalDeduction,
                        "accounts.$[src].balanceInBdt": -totalDeduction,
                        "accounts.$[dst].balance": amount,
                        "accounts.$[dst].balanceInBdt": amount,
                    },
                },
                {
                    arrayFilters: [
                        { "src._id": new mongoose.Types.ObjectId(fromAccountId) },
                        { "dst._id": new mongoose.Types.ObjectId(toAccountId) },
                    ],
                },
            );
        } else {
            // Source account deduction
            await User.updateOne(
                { _id: fromUserId, "accounts._id": fromAccountId },
                {
                    $inc: {
                        "accounts.$.balance": -totalDeduction,
                        "accounts.$.balanceInBdt": -totalDeduction,
                    },
                },
            );

            // Destination account credit
            await User.updateOne(
                { _id: toUserId, "accounts._id": toAccountId },
                {
                    $inc: {
                        "accounts.$.balance": amount,
                        "accounts.$.balanceInBdt": amount,
                    },
                },
            );
        }

        // 5. Create Ledger Transactions with Linked transferGroupId
        const transferGroupId = new mongoose.Types.ObjectId().toString();
        const effectiveDate = date ? new Date(date) : new Date();

        const fromDetails = {
            providerName: fromAccount.providerName,
            accountName: fromAccount.accountName,
            accountNumber: fromAccount.accountNumber,
            type: fromAccount.type,
            branch: fromAccount.branch,
            routingNumber: fromAccount.routingNumber,
        };

        const toDetails = {
            providerName: toAccount.providerName,
            accountName: toAccount.accountName,
            accountNumber: toAccount.accountNumber,
            type: toAccount.type,
            branch: toAccount.branch,
            routingNumber: toAccount.routingNumber,
        };

        // Transfer Out (Sender Account)
        const outDescription = note?.trim()
            ? `Transfer to ${toAccount.providerName} (${toAccount.accountNumber}) - ${note.trim()}`
            : `Transfer to ${toAccount.providerName} (${toAccount.accountNumber}) [${toAccount.accountName}]`;

        await Transaction.create({
            amount: amount,
            type: TransactionType.EXPENSE,
            category: TransactionCategory.TRANSFER,
            description: outDescription,
            date: effectiveDate,
            user: session.user.id,
            accountId: fromAccountId,
            accountUser: fromUserId,
            accountDetails: fromDetails,
            transferGroupId,
        });

        // Transfer Fee (Sender Account) - only if fee > 0
        if (fee > 0) {
            await Transaction.create({
                amount: fee,
                type: TransactionType.EXPENSE,
                category: TransactionCategory.TRANSFER_FEE,
                description: `Transfer fee for transfer to ${toAccount.providerName} (${toAccount.accountNumber})`,
                date: effectiveDate,
                user: session.user.id,
                accountId: fromAccountId,
                accountUser: fromUserId,
                accountDetails: fromDetails,
                transferGroupId,
                fee: fee,
            });
        }

        // Transfer In (Receiver Account)
        const inDescription = note?.trim()
            ? `Transfer received from ${fromAccount.providerName} (${fromAccount.accountNumber}) - ${note.trim()}`
            : `Transfer received from ${fromAccount.providerName} (${fromAccount.accountNumber}) [${fromAccount.accountName}]`;

        await Transaction.create({
            amount: amount,
            type: TransactionType.INCOME,
            category: TransactionCategory.TRANSFER,
            description: inDescription,
            date: effectiveDate,
            user: session.user.id,
            accountId: toAccountId,
            accountUser: toUserId,
            accountDetails: toDetails,
            transferGroupId,
        });

        return NextResponse.json(
            {
                success: true,
                message: `Successfully transferred ৳${amount.toLocaleString()} to ${toAccount.providerName} (${toAccount.accountNumber}). Deducted ৳${totalDeduction.toLocaleString()} (including ৳${fee.toLocaleString()} fee) from ${fromAccount.providerName}.`,
                transferGroupId,
                details: {
                    amount,
                    fee,
                    totalDeducted: totalDeduction,
                    fromAccountId,
                    toAccountId,
                    date: effectiveDate,
                },
            },
            { status: 201 },
        );
    } catch (error: any) {
        console.error("Account transfer error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to complete account transfer" },
            { status: 500 },
        );
    }
}
