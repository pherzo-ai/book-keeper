import { cookies } from "next/headers";

const COOKIE_NAME = "auth_token";
const AUTH_VALUE = "authenticated";

export async function setAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, AUTH_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function isValidAuthToken(token: string | undefined) {
  return token === AUTH_VALUE;
}
