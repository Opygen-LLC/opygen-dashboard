import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import Product from "@/models/Product";
import { transactionSchema } from "@/lib/validations";
import User from "@/models/User";
import { calculateBalanceDelta } from "@/lib/finance";
import Statement from "@/models/Statements";
import { invalidateFinanceSummaryCache } from "@/app/api/finance/summary/route";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
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
        const accountId = searchParams.get("accountId");
        const isAdmin = session.user.role === "admin";

        // Non-admins can only view transactions for their own accounts
        if (!isAdmin) {
            if (!accountId) {
                return NextResponse.json(
                    { error: "Unauthorized. Admin access required." },
                    { status: 401 },
                );
            }
            const userWithAccount = await User.findOne({
                _id: session.user.id,
                "accounts._id": accountId,
            });
            if (!userWithAccount) {
                return NextResponse.json(
                    { error: "Unauthorized to access this account." },
                    { status: 403 },
                );
            }
        }

        const type = searchParams.get("type");
        const category = searchParams.get("category");
        const productName = searchParams.get("productName");
        const user = searchParams.get("user");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "0"); // 0 means no pagination

        const query: any = {};
        if (accountId) query.accountId = accountId;
        if (type) query.type = type;
        if (category) query.category = category;
        if (user) query.user = user;

        if (productName && productName !== "all") {
            const escaped = productName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const matchedProduct = await Product.findOne({
                name: { $regex: new RegExp(`^${escaped}$`, "i") }
            }).lean();

            const orProduct: any[] = [
                { productName: { $regex: new RegExp(`^${escaped}$`, "i") } }
            ];

            if (matchedProduct) {
                orProduct.push({ productId: matchedProduct._id });
                orProduct.push({ productId: matchedProduct._id.toString() });
            }

            if (productName.toLowerCase().includes("estate")) {
                orProduct.push({ productName: { $regex: /real estate crm/i } });
            }

            query.$or = orProduct;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        let dbQuery = Transaction.find(query)
            .populate("user", "name email avatarUrl")
            .populate("accountUser", "name email avatarUrl")
            .populate("productId", "name url")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        if (limit > 0) {
            dbQuery = dbQuery.skip((page - 1) * limit).limit(limit);
        }

        const [rawTransactions, total] = await Promise.all([
            dbQuery.exec(),
            limit > 0 ? Transaction.countDocuments(query) : Promise.resolve(0),
        ]);

        const transactions = rawTransactions.map((tx: any) => {
            if (tx.productId && typeof tx.productId === "object" && tx.productId.name) {
                tx.productName = tx.productId.name;
            }
            return tx;
        });

        if (limit > 0) {
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

        // Snapshot account details from account owner
        const accountOwner = await User.findById(transactionData.accountUser);
        if (!accountOwner) {
            return NextResponse.json(
                { error: "Selected account owner user not found" },
                { status: 400 },
            );
        }
        const selectedAccount = accountOwner.accounts?.find(
            (acc: any) => acc._id?.toString() === transactionData.accountId
        );
        if (!selectedAccount) {
            return NextResponse.json(
                { error: "Selected account not found on user profile" },
                { status: 400 },
            );
        }

        transactionData.accountDetails = {
            providerName: selectedAccount.providerName,
            accountName: selectedAccount.accountName,
            accountNumber: selectedAccount.accountNumber,
            type: selectedAccount.type,
            branch: selectedAccount.branch,
            routingNumber: selectedAccount.routingNumber,
        };

        if (transactionData.category === "product") {
            if (!transactionData.productName && !transactionData.productId) {
                return NextResponse.json(
                    { error: "Product name or ID is required when category is Product" },
                    { status: 400 },
                );
            }

            let matchedProduct: any = null;
            if (transactionData.productId) {
                matchedProduct = await Product.findById(transactionData.productId).lean();
            }
            if (!matchedProduct && transactionData.productName) {
                const escaped = transactionData.productName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                matchedProduct = await Product.findOne({
                    name: { $regex: new RegExp(`^${escaped}$`, "i") }
                }).lean();
                if (!matchedProduct && transactionData.productName.toLowerCase().includes("estate")) {
                    matchedProduct = await Product.findOne({ name: { $regex: /estate/i } }).lean();
                }
            }

            if (matchedProduct) {
                transactionData.productId = matchedProduct._id.toString();
                transactionData.productName = matchedProduct.name;
            } else if (transactionData.productName) {
                transactionData.productName = transactionData.productName.trim();
            }
        } else {
            transactionData.productName = null as any;
            transactionData.productId = null as any;
        }

        if (transactionData.amount !== undefined) {
            transactionData.amount = Number(transactionData.amount);
        }

        const newTransaction = new Transaction(transactionData);
        await newTransaction.save();

        // Atomically adjust the account balance on User (BDT)
        const isIncome = transactionData.type === "income";
        const delta = isIncome ? Number(transactionData.amount) : -Number(transactionData.amount);

        await User.updateOne(
            { _id: transactionData.accountUser, "accounts._id": transactionData.accountId },
            {
                $inc: {
                    "accounts.$.balance": delta,
                    "accounts.$.balanceInBdt": delta,
                },
            }
        );

        // Create Statement if user is assigned and category is statement-relevant.
        const userId = transactionData.user ? transactionData.user.toString() : null;

        if (userId) {
            const statementCategories = ['salary', 'allowance', 'loan_taken', 'loan_collected', 'loan_given', 'loan_repayment'];
            if (statementCategories.includes(transactionData.category)) {
                const stmtType = (transactionData.category === 'loan_taken' || transactionData.category === 'loan_collected') ? '-' : '+';
                await Statement.create({
                    user: userId,
                    transaction: newTransaction._id,
                    amount: transactionData.amount,
                    type: stmtType,
                    category: transactionData.category,
                    description: transactionData.description,
                    date: transactionData.date || new Date(),
                });
                
                // Explicitly update user balance and balanceInBdt
                const balanceDelta = stmtType === '+' ? Number(transactionData.amount) : -Number(transactionData.amount);
                await User.findByIdAndUpdate(userId, {
                    $inc: { balance: balanceDelta, balanceInBdt: balanceDelta }
                });
            }
        }

        // Populate user, accountUser, and productId before returning
        await newTransaction.populate("user", "name email avatarUrl");
        await newTransaction.populate("accountUser", "name email avatarUrl");
        await newTransaction.populate("productId", "name url");

        invalidateFinanceSummaryCache();

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error: any) {
        console.error("Create transaction error:", error);
        return NextResponse.json(
            { error: "Server Error", details: error.message },
            { status: 500 },
        );
    }
}
