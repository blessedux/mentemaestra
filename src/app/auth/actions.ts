"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  createAuthBridge,
  SupabaseAuthGateway,
} from "@/lib/modules/auth-bridge";
import {
  createSessionOrchestrator,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";
import { createClient } from "@/lib/supabase/server";

function siteOrigin(headerStore: Headers): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

async function mergeAnonymousSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    throw new Error("Missing anonymous session cookie");
  }

  const session = await createSessionOrchestrator().getSession(token);
  if (!session) {
    throw new Error("Anonymous session expired or invalid");
  }

  await createAuthBridge().mergeSession(session.id, userId);
}

/** Soft-gate Save & Continue: merge if authed, otherwise send to /auth. */
export async function saveAndContinue(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/chat");
  }

  try {
    await mergeAnonymousSession(user.id);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "merge_failed";
    if (message.includes("session")) {
      redirect("/start");
    }
    redirect(`/chat?error=${encodeURIComponent(message)}`);
  }

  redirect("/chat");
}

export async function requestMagicLink(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const nextRaw = String(formData.get("next") ?? "/chat");
  const next = nextRaw.startsWith("/") ? nextRaw : "/chat";

  if (!email) {
    redirect(`/auth?next=${encodeURIComponent(next)}&error=email_required`);
  }

  const headerStore = await headers();
  const origin = siteOrigin(headerStore);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const supabase = await createClient();
  const bridge = createAuthBridge(new SupabaseAuthGateway(supabase));
  const result = await bridge.triggerAuth({
    method: "magic_link",
    email,
    redirectTo,
  });

  if (result.status === "authenticated") {
    try {
      await mergeAnonymousSession(result.userId);
    } catch (err) {
      const message =
        err instanceof Error ? encodeURIComponent(err.message) : "merge_failed";
      redirect(`/auth?next=${encodeURIComponent(next)}&error=${message}`);
    }
    redirect(next);
  }

  if (result.status === "error") {
    redirect(
      `/auth?next=${encodeURIComponent(next)}&error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(
    `/auth?next=${encodeURIComponent(next)}&sent=${encodeURIComponent(email)}`,
  );
}

export async function requestGoogleAuth(formData: FormData): Promise<void> {
  const nextRaw = String(formData.get("next") ?? "/chat");
  const next = nextRaw.startsWith("/") ? nextRaw : "/chat";
  const headerStore = await headers();
  const origin = siteOrigin(headerStore);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const supabase = await createClient();
  const bridge = createAuthBridge(new SupabaseAuthGateway(supabase));
  const result = await bridge.triggerAuth({
    method: "google",
    redirectTo,
  });

  if (result.status === "authenticated") {
    try {
      await mergeAnonymousSession(result.userId);
    } catch (err) {
      const message =
        err instanceof Error ? encodeURIComponent(err.message) : "merge_failed";
      redirect(`/auth?next=${encodeURIComponent(next)}&error=${message}`);
    }
    redirect(next);
  }

  if (result.status === "oauth_redirect") {
    redirect(result.url);
  }

  const message =
    result.status === "error" ? result.message : "google_auth_failed";
  redirect(
    `/auth?next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`,
  );
}
