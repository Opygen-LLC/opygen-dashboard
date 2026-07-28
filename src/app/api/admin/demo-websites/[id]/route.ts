import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { DemoWebsite } from "@/models/DemoWebsite";
import { demoWebsiteSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();

        const parsed = demoWebsiteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation error", details: parsed.error.format() },
                { status: 400 }
            );
        }

        await dbConnect();

        const updatedWebsite = await DemoWebsite.findByIdAndUpdate(
            id,
            parsed.data,
            { new: true, runValidators: true }
        );

        if (!updatedWebsite) {
            return NextResponse.json({ error: "Demo website not found" }, { status: 404 });
        }

        return NextResponse.json(updatedWebsite);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to update demo website" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id } = await params;

        await dbConnect();

        const deletedWebsite = await DemoWebsite.findByIdAndDelete(id);

        if (!deletedWebsite) {
            return NextResponse.json({ error: "Demo website not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Demo website deleted successfully" });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to delete demo website" },
            { status: 500 }
        );
    }
}
