import { NextRequest, NextResponse } from "next/server";
import { getClientFromJWT } from "@/lib/getClientFromJWT";

export async function GET(req: NextRequest) {
  const client = await getClientFromJWT(req);
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const messages = await client.getMessages("me", {
    limit: 1000, // A higher limit to get a better estimate of total storage
  });

  const totalSize = messages
    .filter((message) => message.file && message.message?.startsWith("filestore4u_"))
    .reduce((acc, message) => acc + (message.file.size || 0), 0);

  return NextResponse.json({ success: true, totalSize });
}
