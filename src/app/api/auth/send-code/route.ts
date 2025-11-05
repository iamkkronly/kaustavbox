import { NextRequest, NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export async function POST(req: NextRequest) {
  const { phoneNumber } = await req.json();

  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH as string;
  const stringSession = new StringSession("");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  const { phoneCodeHash } = await client.sendCode(
    {
      apiId,
      apiHash,
    },
    phoneNumber
  );

  return NextResponse.json({ phoneCodeHash });
}
