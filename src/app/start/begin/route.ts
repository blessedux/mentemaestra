import { NextResponse, type NextRequest } from "next/server";
import { parseMission } from "@/lib/domain/mission";
import {
  createSessionOrchestrator,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/modules/session-orchestrator";

/**
 * Creates an anonymous session for `/start?mission=…` and sets `mm_session`.
 * Cookie writes belong in a Route Handler (not a Server Component render).
 */
export async function GET(request: NextRequest) {
  const mission = parseMission(request.nextUrl.searchParams.get("mission"));

  if (!mission) {
    return NextResponse.redirect(new URL("/start", request.url));
  }

  try {
    const orchestrator = createSessionOrchestrator();
    const session = await orchestrator.createSession(mission);

    const response = NextResponse.redirect(new URL("/chat", request.url));
    response.cookies.set(
      SESSION_COOKIE_NAME,
      session.cookieToken,
      getSessionCookieOptions(),
    );
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo iniciar la sesión";
    const failure = new URL("/start", request.url);
    failure.searchParams.set("error", message);
    return NextResponse.redirect(failure);
  }
}
