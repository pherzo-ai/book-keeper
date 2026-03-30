import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "auth_token";
const AUTH_VALUE = "authenticated";

export async function POST(request: NextRequest) {
  const { passphrase } = await request.json();

  if (passphrase !== process.env.APP_PASSPHRASE) {
    return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, AUTH_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
