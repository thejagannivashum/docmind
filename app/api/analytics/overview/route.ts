import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const data = store.getAnalytics();
  return NextResponse.json(data);
}
