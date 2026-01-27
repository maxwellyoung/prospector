import { Suspense } from "react";
import { MiningInterface } from "@/components/mining/mining-interface";

export const metadata = {
  title: "Mine — Prospector",
  description: "Discover SaaS opportunities by mining frustration signals from the internet.",
};

function MinePageContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // In a real app, we'd await searchParams and pass it.
  // For now, mining interface handles its own state.
  return <MiningInterface />;
}

export default function MinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
        </div>
      }
    >
      <MinePageContent searchParams={searchParams} />
    </Suspense>
  );
}
