import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const sessions = store.sessions.map((s) => ({
    id: s.id,
    title: s.title,
    created_at: s.createdAt,
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json(sessions);
}
