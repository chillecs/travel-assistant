import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative min-h-svh bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200/70 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-slate-100/80 blur-3xl" />
      </div>
      <div className="relative flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
