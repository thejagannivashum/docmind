import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const docs = store.documents.map((d) => ({
    id: d.id,
    title: d.title,
    file_type: d.file_type,
    file_size_bytes: d.file_size_bytes,
    chunk_count: d.chunk_count,
    status: d.status,
    error_message: d.error_message,
    upload_date: d.upload_date,
    collection_id: d.collection_id,
  }));

  return NextResponse.json(docs);
}
