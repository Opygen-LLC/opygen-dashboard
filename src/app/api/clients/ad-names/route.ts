import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Client from "@/models/Client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const adNames = await Client.distinct("adName", {
      adName: { $exists: true, $ne: "" },
    });
    const cleanAdNames = adNames
      .filter((name: any) => typeof name === "string" && name.trim() !== "")
      .map((name: string) => name.trim())
      .sort();

    return NextResponse.json(cleanAdNames);
  } catch (error: any) {
    console.error("Fetch ad names error:", error);
    return NextResponse.json(
      { error: "Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Ad Name parameter is required" },
        { status: 400 }
      );
    }

    const targetAdName = name.trim();
    const result = await Client.updateMany(
      { adName: targetAdName },
      { $set: { adName: "" } }
    );

    return NextResponse.json({
      message: `Ad name "${targetAdName}" deleted successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Delete ad name error:", error);
    return NextResponse.json(
      { error: "Server Error", details: error.message },
      { status: 500 }
    );
  }
}
