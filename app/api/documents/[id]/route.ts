import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id, 10);
  const success = store.deleteDocument(docId);
  if (!success) {
    return NextResponse.json({ detail: "Document not found." }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
