import { Skeleton } from "@/components/ui";

export default function NewsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-48" />
        <div className="mt-1.5">
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <Skeleton className="h-52 w-full rounded-xl mb-6" />
      <Skeleton className="h-20 w-full rounded-xl mb-8" />

      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
