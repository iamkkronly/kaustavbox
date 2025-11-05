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

  const { folderName, currentPath } = await req.json();
  const fullPath = path.join(currentPath, folderName);
  const placeholderFileName = ".placeholder";
  const caption = `filestore4u_${fullPath}/${placeholderFileName}`;

  const tempDir = path.join(process.cwd(), "tmp");
  await fs.mkdir(tempDir, { recursive: true });
  const tempFilePath = path.join(tempDir, placeholderFileName);
  await fs.writeFile(tempFilePath, ""); // Create an empty file

  await client.sendFile("me", {
    file: tempFilePath,
    caption: caption,
  });

  await fs.unlink(tempFilePath);

  return NextResponse.json({ success: true, message: "Folder created successfully" });
}
