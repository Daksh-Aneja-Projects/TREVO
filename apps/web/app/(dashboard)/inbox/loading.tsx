import { Skeleton } from "@/components/ui";

export default function InboxLoading() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-10 w-full mb-6" />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
