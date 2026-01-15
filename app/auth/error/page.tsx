import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return params?.error ? (
    <p className="text-sm text-slate-600">
      Code error: {params.error}
    </p>
  ) : (
    <p className="text-sm text-slate-600">
      An unspecified error occurred.
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <AuthShell>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
          <AlertTriangle size={18} strokeWidth={1.2} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sorry, something went wrong.
          </h1>
          <p className="text-sm text-slate-600">
            We couldn&apos;t complete that request. Please try again.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-left shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </div>
        <Button asChild className="h-11 rounded-xl">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
