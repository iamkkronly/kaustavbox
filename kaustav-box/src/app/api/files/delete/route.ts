import { NextRequest, NextResponse } from "next/server";
import { getClientFromJWT } from "@/lib/getClientFromJWT";

export async function POST(req: NextRequest) {
  const client = await getClientFromJWT(req);
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { id } = await req.json();
  await client.deleteMessages("me", [id], { revoke: true });

  return NextResponse.json({ success: true });
}
