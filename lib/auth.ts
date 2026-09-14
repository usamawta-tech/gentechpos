import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken, type SessionPayload } from "@/lib/session";

// Read + verify the current session on the server (server components / route handlers).
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
