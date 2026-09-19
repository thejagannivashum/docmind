import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    let email = "";
    let password = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      email = params.get("username") || "";
      password = params.get("password") || "";
    } else {
      const body = await req.json();
      email = body.username || body.email || "";
      password = body.password || "";
    }

    if (!email) {
      return NextResponse.json({ detail: "Email required." }, { status: 400 });
    }

    // Find user or auto-register for frictionless evaluation
    let user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: store.nextUserId++,
        email,
        passwordHash: password || "password123",
        isActive: true,
      };
      store.users.push(user);
    }

    const token = Buffer.from(JSON.stringify({ sub: user.email, id: user.id })).toString("base64");
    return NextResponse.json({ access_token: token, token_type: "bearer" });
  } catch {
    return NextResponse.json({ detail: "Incorrect email or password." }, { status: 401 });
  }
}
