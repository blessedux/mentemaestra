import Link from "next/link";
import { requestGoogleAuth, requestMagicLink } from "./actions";

type AuthPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    sent?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/chat";
  const error = params.error ?? null;
  const sent = params.sent ?? null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-zinc-900">
      <div className="w-full max-w-md">
        <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
          Mente Maestra
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Guarda tu progreso
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Soft gate: inicia sesión para vincular esta conversación a tu negocio.
          Maya sigue siendo la única cara — el auth es solo para guardar.
        </p>

        {sent ? (
          <p
            className="mt-6 rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700"
            role="status"
          >
            Te enviamos un magic link a <strong>{sent}</strong>. Abre el correo
            para continuar.
          </p>
        ) : null}

        {error ? (
          <p
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {decodeURIComponent(error)}
          </p>
        ) : null}

        <form action={requestMagicLink} className="mt-8 space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm font-medium text-zinc-700">
            Email
            <input
              type="email"
              name="email"
              required
              placeholder="tu@empresa.com"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Enviar magic link
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs tracking-wide text-zinc-400 uppercase">
          <span className="h-px flex-1 bg-zinc-200" />
          o
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <form action={requestGoogleAuth}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
          >
            Continuar con Google
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link href="/chat" className="underline underline-offset-4">
            Volver al chat
          </Link>
        </p>
      </div>
    </main>
  );
}
