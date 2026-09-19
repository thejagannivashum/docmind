import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ detail: "Password must be at least 8 characters." }, { status: 400 });
    }
    const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ detail: "An account with this email already exists." }, { status: 400 });
    }

    const newUser = {
      id: store.nextUserId++,
      email,
      passwordHash: password,
      isActive: true,
    };
    store.users.push(newUser);

    return NextResponse.json({ id: newUser.id, email: newUser.email }, { status: 201 });
  } catch {
    return NextResponse.json({ detail: "Invalid request" }, { status: 400 });
  }
}
