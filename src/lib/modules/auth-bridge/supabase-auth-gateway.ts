import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthGateway } from "./types";

/** Browser or server anon Supabase client used for auth challenge UX. */
export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly supabase: SupabaseClient) {}

  async getUserId(): Promise<string | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      throw new Error(error.message);
    }
    return data.user?.id ?? null;
  }

  async signInWithMagicLink(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  async signInWithGoogle(redirectTo: string): Promise<{ url: string }> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.url) {
      throw new Error("Google OAuth did not return a redirect URL");
    }
    return { url: data.url };
  }
}
