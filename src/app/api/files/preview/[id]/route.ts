import { NextRequest, NextResponse } from "next/server";
import { getClientFromJWT } from "@/lib/getClientFromJWT";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await getClientFromJWT(req);
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const messageId = parseInt(params.id);

  const messages = await client.getMessages("me", {
    ids: [messageId],
  });

  if (messages.length === 0 || !messages[0].file) {
    return NextResponse.json(
      { success: false, error: "File not found" },
      { status: 404 }
    );
  }

  const message = messages[0];
  const buffer = await client.downloadMedia(message, {
    thumb: "i",
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
    },
  });
}
