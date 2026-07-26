import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ message: "Deprecated: portalToken is no longer required" });
}

export async function POST() {
    return NextResponse.json({ message: "Deprecated: portalToken is no longer required" });
}
