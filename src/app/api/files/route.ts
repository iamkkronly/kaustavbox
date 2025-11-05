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

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/";
  const offsetId = parseInt(searchParams.get("offsetId") || "0");
  const limit = 20;

  const messages = await client.getMessages("me", {
    limit: limit,
    offsetId: offsetId,
  });

  const files = messages
    .filter((message) => {
      if (!message.file || !message.message?.startsWith("filestore4u_")) {
        return false;
      }
      const filePath = message.message
        .replace("filestore4u_", "")
        .replace(/\/.placeholder$/, "/");
      if (path === "/") {
        // Root directory logic needs to be more robust.
        // It should show items in the root, but not in subfolders.
        const pathParts = filePath.split("/").filter(p => p);
        return pathParts.length === 1;

      } else {
        // Subdirectory logic
        return filePath.startsWith(path) && filePath.replace(path, "").split("/").length < 2;
      }
    })
    .map((message) => {
      const name = message.message.replace("filestore4u_", "");
      const isFolder = name.endsWith(".placeholder");
      const displayName = name.replace(path, "").replace(".placeholder", "/");
      return {
        id: message.id,
        caption: message.message,
        date: message.date,
        size: message.file.size,
        name: displayName,
        type: isFolder ? "folder" : "file",
        hasThumbnail: !!message.photo,
      };
    });

  const nextOffsetId = messages.length > 0 ? messages[messages.length - 1].id : 0;

  return NextResponse.json({ success: true, files: files, nextOffsetId: nextOffsetId });
}
