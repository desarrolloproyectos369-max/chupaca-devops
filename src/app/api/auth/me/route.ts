import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json(null, { status: 401 });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(null, { status: 500 });
  }
}
