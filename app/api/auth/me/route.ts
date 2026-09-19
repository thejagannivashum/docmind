import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  let email = "demo@docmind.ai";

  if (auth.startsWith("Bearer ")) {
    try {
      const decoded = JSON.parse(Buffer.from(auth.slice(7), "base64").toString("utf-8"));
      if (decoded.sub) email = decoded.sub;
    } catch {
      // fallback to demo email
    }
  }

  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || store.users[0];

  return NextResponse.json({
    id: user ? user.id : 1,
    email: user ? user.email : email,
    is_active: true,
  });
}
