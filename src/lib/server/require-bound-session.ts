import { cookies } from "next/headers";
import type { Session } from "@/lib/domain/session";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";
import { createClient } from "@/lib/supabase/server";

export type BoundSessionContext = {
  userId: string;
  session: Session & { businessId: string };
};

/**
 * Requires an authenticated Supabase user and an anonymous session bound to a Business.
 */
export async function requireBoundSession(): Promise<
  | { ok: true; context: BoundSessionContext }
  | { ok: false; response: Response }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return {
        ok: false,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const session = await createSessionOrchestrator().getSession(token);
    if (!session) {
      return {
        ok: false,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    if (!session.businessId) {
      return {
        ok: false,
        response: Response.json(
          { error: "Business binding required before editing" },
          { status: 403 },
        ),
      };
    }

    return {
      ok: true,
      context: {
        userId: user.id,
        session: { ...session, businessId: session.businessId },
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to authorize edit";
    return {
      ok: false,
      response: Response.json({ error: message }, { status: 503 }),
    };
  }
}
