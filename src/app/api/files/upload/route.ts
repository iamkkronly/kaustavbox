import { NextRequest, NextResponse } from "next/server";
import { getClientFromJWT } from "@/lib/getClientFromJWT";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const client = await getClientFromJWT(req);
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const data = await req.formData();
  const file = data.get("file") as Blob;
  const currentPath = data.get("path") as string;
  const fileName = (file as any).name;

  const fullPath = path.join(currentPath, fileName);
  const caption = `filestore4u_${fullPath}`;

  const tempDir = path.join(process.cwd(), "tmp");
  await fs.mkdir(tempDir, { recursive: true });
  const tempFilePath = path.join(tempDir, fileName);
  await fs.writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));

  const result = await client.sendFile("me", {
    file: tempFilePath,
    caption: caption,
  });

  await fs.unlink(tempFilePath);

  return NextResponse.json({ success: true, result });
}
