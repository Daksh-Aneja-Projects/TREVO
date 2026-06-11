import { Skeleton } from "@/components/ui";

export default function ArchiveLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-52" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}
