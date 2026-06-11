import { Skeleton } from "@/components/ui";

export default function CommonsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}
