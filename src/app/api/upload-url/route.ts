import { NextResponse } from "next/server";

export async function GET() {
  const storageId = await convex.storage.generateUploadUrl();
  return NextResponse.json(storageId);
}
