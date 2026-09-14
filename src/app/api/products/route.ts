import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { productSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_PRODUCTS = [
    {
        name: "Opygen Cleaning CRM",
        url: "https://cleaningcrm.opygen.com/admin/dashboard",
        description: "Cleaning service operations, client management, and invoicing.",
    },
    {
        name: "Opygen Estate",
        url: "https://realestate.opygen.com/",
        description: "Real estate platform, properties showcase, and client portal.",
    },
];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();

        // Auto-seed initial products if empty
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(DEFAULT_PRODUCTS);
        }

        const products = await Product.find().sort({ createdAt: 1 }).lean();

        return NextResponse.json(products, {
            headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
        });
    } catch (error: any) {
        console.error("GET /api/products error:", error);
        return NextResponse.json(
            { error: error.message || "Server error fetching products" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json(
            { error: "Unauthorized. Admin access required." },
            { status: 401 }
        );
    }

    try {
        await dbConnect();
        const body = await req.json();

        const parseResult = productSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const { name, url, description } = parseResult.data;

        // Check uniqueness (case-insensitive)
        const existing = await Product.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        });
        if (existing) {
            return NextResponse.json(
                { error: "A product with this name already exists" },
                { status: 409 }
            );
        }

        const product = await Product.create({
            name: name.trim(),
            url: url.trim(),
            description: description?.trim() || "",
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/products error:", error);
        return NextResponse.json(
            { error: error.message || "Server error creating product" },
            { status: 500 }
        );
    }
}
