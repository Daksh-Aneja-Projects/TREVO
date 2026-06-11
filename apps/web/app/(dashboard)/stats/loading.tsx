import { Skeleton } from "@/components/ui";

export default function StatsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-64" />
        <div className="mt-1.5">
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <Skeleton className="h-24 w-full rounded-xl mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
