import { NextRequest, NextResponse } from "next/server";
import { getClientFromJWT } from "@/lib/getClientFromJWT";
import { Api } from "telegram";

export async function POST(req: NextRequest) {
  const client = await getClientFromJWT(req);
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { id, newCaption } = await req.json();
  await client.invoke(
    new Api.messages.EditMessage({
      peer: "me",
      id: id,
      message: newCaption,
    })
  );

  return NextResponse.json({ success: true });
}
