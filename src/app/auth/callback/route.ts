import { NextResponse, type NextRequest } from "next/server";
import { createAuthBridge } from "@/lib/modules/auth-bridge";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase PKCE/code exchange, then merge the anonymous mm_session into a Business.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";
  const safeNext = next.startsWith("/") ? next : "/chat";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (user && token) {
        try {
          const session =
            await createSessionOrchestrator().getSession(token);
          if (session) {
            await createAuthBridge().mergeSession(session.id, user.id);
          }
        } catch {
          return NextResponse.redirect(
            `${origin}/auth?next=${encodeURIComponent(safeNext)}&error=merge_failed`,
          );
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth?next=${encodeURIComponent(safeNext)}&error=auth_callback`,
  );
}
