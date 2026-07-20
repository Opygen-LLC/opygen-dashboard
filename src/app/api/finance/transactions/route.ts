import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import { transactionSchema } from "@/lib/validations";
import User from "@/models/User";
import { calculateBalanceDelta } from "@/lib/finance";
import Statement from "@/models/Statements";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json(
            { error: "Unauthorized. Admin access required." },
            { status: 401 },
        );
    }

    try {
        await dbConnect();

        // Check if User model is registered to ensure population works
        if (!User) {
            console.warn("User model not loaded");
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const category = searchParams.get("category");
        const user = searchParams.get("user");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "0"); // 0 means no pagination

        const query: any = {};
        if (type) query.type = type;
        if (category) query.category = category;
        if (user) query.user = user;

        let dbQuery = Transaction.find(query)
            .populate("user", "name email avatarUrl")
            .sort({ date: -1, createdAt: -1 });

        if (limit > 0) {
            dbQuery = dbQuery.skip((page - 1) * limit).limit(limit);
        }

        const transactions = await dbQuery.exec();

        if (limit > 0) {
            const total = await Transaction.countDocuments(query);
            return NextResponse.json({
                transactions,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total,
            });
        }

        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error("Fetch transactions error:", error);
        return NextResponse.json(
            { error: "Server Error", details: error.message },
            { status: 500 },
        );
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json(
            { error: "Unauthorized. Admin access required." },
            { status: 401 },
        );
    }

    try {
        await dbConnect();
        const body = await req.json();

        const parseResult = transactionSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.flatten() },
                { status: 400 },
            );
        }

        const transactionData = parseResult.data;

        const newTransaction = new Transaction(transactionData);
        await newTransaction.save();

        // Create Statement if user is assigned and category is statement-relevant.
        // The Statement model's post-save hook automatically updates user.balance.
        const userId = transactionData.user ? transactionData.user.toString() : null;

        if (userId) {
            const statementCategories = ['salary', 'loan_taken', 'loan_given', 'loan_repayment'];
            if (statementCategories.includes(transactionData.category)) {
                const stmtType = transactionData.category === 'loan_taken' ? '-' : '+';
                await Statement.create({
                    user: userId,
                    transaction: newTransaction._id,
                    amount: transactionData.amount,
                    type: stmtType,
                    category: transactionData.category,
                    description: transactionData.description,
                    date: transactionData.date || new Date(),
                });
                
                // Explicitly update user balance
                const balanceDelta = stmtType === '+' ? Number(transactionData.amount) : -Number(transactionData.amount);
                await User.findByIdAndUpdate(userId, {
                    $inc: { balance: balanceDelta }
                });
            }
        }

        // Populate user before returning
        await newTransaction.populate("user", "name email avatarUrl");

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error: any) {
        console.error("Create transaction error:", error);
        return NextResponse.json(
            { error: "Server Error", details: error.message },
            { status: 500 },
        );
    }
}
