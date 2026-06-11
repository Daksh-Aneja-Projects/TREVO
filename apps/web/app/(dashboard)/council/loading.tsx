import { Skeleton } from "@/components/ui";

export default function CouncilLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-40" />
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}
