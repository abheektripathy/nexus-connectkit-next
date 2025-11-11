import { Suspense } from "react";
import BalanceDashboard from "@/components/BalanceDashboard";

function DashboardFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            <span className="text-zinc-400 dark:text-zinc-600">+</span>
            <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            <span className="text-zinc-400 dark:text-zinc-600">+</span>
            <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          <div className="h-6 w-96 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        </div>
        <div className="h-12 w-40 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-full" />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <BalanceDashboard />
    </Suspense>
  );
}
