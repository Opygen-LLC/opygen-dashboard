import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Transaction from "@/models/Transaction";
import { productSchema } from "@/lib/validations";
import { syncTransactionsForProduct } from "@/lib/productSync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await dbConnect();

        const product = await Product.findById(id).lean();
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Fetch all transactions associated with this product (by productId or productName)
        const escapedName = product.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const orConditions: any[] = [
            { productId: product._id },
            { productId: product._id.toString() },
            { productName: { $regex: new RegExp(`^${escapedName}$`, "i") } },
        ];
        if (product.name.toLowerCase().includes("estate")) {
            orConditions.push({ productName: { $regex: /real estate crm/i } });
        }

        const transactions = await Transaction.find({
            $or: orConditions,
        })
            .populate("user", "name email avatarUrl")
            .populate("accountUser", "name email avatarUrl")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        let totalIncome = 0;
        let totalExpense = 0;
        let newCount = 0;
        let renewCount = 0;

        for (const tx of transactions) {
            if (tx.category === "transfer") continue;
            const val = Number(tx.amount || 0);
            if (tx.type === "income") {
                totalIncome += val;
            } else if (tx.type === "expense") {
                totalExpense += val;
            }

            if (tx.orderType === "renew") {
                renewCount++;
            } else if (tx.orderType === "new") {
                newCount++;
            }
        }

        const netRevenue = totalIncome - totalExpense;

        return NextResponse.json(
            {
                product,
                summary: {
                    totalIncome,
                    totalExpense,
                    netRevenue,
                    transactionCount: transactions.length,
                    newCount,
                    renewCount,
                },
                transactions,
            },
            {
                headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
            }
        );
    } catch (error: any) {
        console.error("GET /api/products/[id] error:", error);
        return NextResponse.json(
            { error: error.message || "Server error fetching product details" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json(
            { error: "Unauthorized. Admin access required." },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        await dbConnect();

        const body = await req.json();
        const parseResult = productSchema.partial().safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const product = await Product.findById(id);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const { name, url, description } = parseResult.data;

        // Check if name is being changed and if it already exists
        if (name && name.trim() !== product.name) {
            const existing = await Product.findOne({
                _id: { $ne: product._id },
                name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
            });
            if (existing) {
                return NextResponse.json(
                    { error: "A product with this name already exists" },
                    { status: 409 }
                );
            }

            const oldName = product.name;
            product.name = name.trim();

            // Cascade update all existing transactions referencing this product
            await syncTransactionsForProduct(product._id, product.name, oldName);
        } else {
            // Even if name didn't change, ensure transactions linked by productId have up-to-date productName
            await syncTransactionsForProduct(product._id, product.name);
        }

        if (url !== undefined) product.url = url.trim();
        if (description !== undefined) product.description = description.trim();

        await product.save();

        return NextResponse.json(product);
    } catch (error: any) {
        console.error("PATCH /api/products/[id] error:", error);
        return NextResponse.json(
            { error: error.message || "Server error updating product" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json(
            { error: "Unauthorized. Admin access required." },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        await dbConnect();

        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Product deleted" });
    } catch (error: any) {
        console.error("DELETE /api/products/[id] error:", error);
        return NextResponse.json(
            { error: error.message || "Server error deleting product" },
            { status: 500 }
        );
    }
}
