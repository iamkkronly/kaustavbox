import { NextRequest } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import jwt from "jsonwebtoken";

export async function getClientFromJWT(
  req: NextRequest
): Promise<TelegramClient | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { session: string };
    const sessionString = decoded.session;

    const apiId = Number(process.env.API_ID);
    const apiHash = process.env.API_HASH as string;
    const stringSession = new StringSession(sessionString);

    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();
    return client;
  } catch (error) {
    return null;
  }
}
