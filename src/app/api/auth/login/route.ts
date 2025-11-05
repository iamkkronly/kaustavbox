import { NextRequest, NextResponse } from "next/server";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { Password } from "telegram/crypto";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const { phoneNumber, phoneCode, password, phoneCodeHash } = await req.json();

  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH as string;
  const stringSession = new StringSession("");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode,
      })
    );
  } catch (error: any) {
    if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
      if (!password) {
        return NextResponse.json({
          error: "Two-factor authentication is enabled. Please provide a password.",
        }, { status: 400 });
      }
      const { srpId, currentAlgorithm, srpB } = await client.invoke(
        new Api.account.GetPassword()
      );

      const { g, p, salt1, salt2 } = currentAlgorithm;

      const { A, M1 } = await Password.computeCheck(
        {
          g,
          p,
          salt1,
          salt2,
        },
        password
      );

      await client.invoke(
        new Api.auth.CheckPassword({
          password: new Api.InputCheckPasswordSRP({
            srpId,
            A,
            M1,
          }),
        })
      );
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const sessionString = client.session.save();
  const token = jwt.sign({ session: sessionString }, process.env.JWT_SECRET as string);

  const response = NextResponse.json({ success: true });
  response.cookies.set("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  return response;
}
