import { Skeleton } from "@/components/ui";

export default function NotificationsLoading() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-28 mb-6" />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
