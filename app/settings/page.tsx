export default function SettingsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200/70 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-slate-100/80 blur-3xl" />
      </div>
      <section className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pb-24 pt-16 lg:pt-24">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-3 text-sm text-slate-600">
            Profile and preference settings are coming soon.
          </p>
        </div>
      </section>
    </main>
  );
}
