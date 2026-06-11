import { Skeleton } from "@/components/ui";

export default function BookingsLoading() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-48 mb-6" />
      <Skeleton className="h-10 w-full mb-6" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
