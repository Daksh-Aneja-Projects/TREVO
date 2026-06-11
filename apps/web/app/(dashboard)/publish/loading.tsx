import { Skeleton } from "@/components/ui";

export default function PublishLoading() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <Skeleton className="h-8 w-56 mb-2" />
      <Skeleton className="h-4 w-72 mb-8" />
      <div style={{ display: "flex", gap: 4, marginBottom: 40 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
