"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import { NotificationItem, Button, Skeleton, EmptyState, TabBar } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const notifications = trpc.notifications.list.useQuery({ unreadOnly });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => notifications.refetch(),
  });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => notifications.refetch(),
  });

  const items = notifications.data?.items || [];
  const unreadCount = items.filter((n: any) => !n.read).length;

  const handleClick = (n: any) => {
    if (!n.read) {
      markRead.mutate({ ids: [n.id] });
    }
    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Notifications</h1>
              <p className="text-sm text-trevo-text-secondary mt-1">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} className="gap-1.5">
                <CheckCheck size={14} /> Mark all read
              </Button>
            )}
          </div>

          <div className="mb-4">
            <TabBar
              tabs={[
                { key: "all", label: "All" },
                { key: "unread", label: "Unread", count: unreadCount || undefined },
              ]}
              active={unreadOnly ? "unread" : "all"}
              onChange={(k) => setUnreadOnly(k === "unread")}
            />
          </div>

          {notifications.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={unreadOnly ? "No unread notifications" : "No notifications yet"}
              description="You'll be notified about enquiries, bookings, verifications, and community activity."
            />
          ) : (
            <div className="border border-trevo-border rounded-lg overflow-hidden bg-trevo-surface">
              {items.map((n: any) => (
                <NotificationItem
                  key={n.id}
                  type={n.type}
                  title={n.title}
                  body={n.body}
                  time={formatRelative(n.createdAt)}
                  read={n.read}
                  linkUrl={n.linkUrl}
                  onClick={() => handleClick(n)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
