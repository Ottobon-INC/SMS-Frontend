import { Loader2, ShieldCheck } from "lucide-react";

export function AuthTransitionScreen({
  title = "Preparing your workspace",
  message = "Verifying your role, permissions, and active access context.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/30">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Verified access</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">{title}</h1>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-300">{message}</p>

        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
          <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
          <span className="text-sm font-semibold text-slate-200">Opening dashboard...</span>
        </div>
      </section>
    </main>
  );
}
