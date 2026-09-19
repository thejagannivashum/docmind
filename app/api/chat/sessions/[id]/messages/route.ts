import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  const msgs = store.messages
    .filter((m) => m.sessionId === sessionId)
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      confidence: m.confidence ?? null,
      conflict_detected: m.conflictDetected ?? false,
      sources: m.sources ?? [],
      timestamp: m.timestamp,
    }));

  return NextResponse.json(msgs);
}
