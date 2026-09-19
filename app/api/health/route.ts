import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "DocMind AI",
    timestamp: new Date().toISOString(),
  });
}
