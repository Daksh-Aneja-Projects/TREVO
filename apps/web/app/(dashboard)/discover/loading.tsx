import { Skeleton } from "@/components/ui";

export default function DiscoverLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-56" />
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
