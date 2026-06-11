"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar, Footer } from "@/components/shared/layout";
import { InboxItem, TabBar, Skeleton, EmptyState, SearchInput } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { Mail } from "lucide-react";

export default function InboxPage() {
  const router = useRouter();
  const [tab, setTab] = useState("received");
  const [search, setSearch] = useState("");

  const received = trpc.enquiry.listInboxEnquiries.useQuery({}, { enabled: tab === "received" });
  const sent = trpc.enquiry.listSentEnquiries.useQuery({}, { enabled: tab === "sent" });

  const items = tab === "received" ? received.data?.items : sent.data?.items;
  const loading = tab === "received" ? received.isLoading : sent.isLoading;

  const filtered = (items || []).filter((item: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return item.subject?.toLowerCase().includes(s) ||
      item.sender?.username?.toLowerCase().includes(s) ||
      item.recipient?.username?.toLowerCase().includes(s);
  });

  const unreadCount = (received.data?.items || []).filter((e: any) => e.status === "OPEN").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Inbox</h1>
              <p className="text-sm text-trevo-text-secondary mt-1">Your enquiry messages</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <TabBar
              tabs={[
                { key: "received", label: "Received", count: unreadCount || undefined },
                { key: "sent", label: "Sent" },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          <div className="mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search enquiries..." />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Mail}
              title={search ? "No matching enquiries" : tab === "received" ? "No enquiries yet" : "No sent enquiries"}
              description={search ? "Try a different search term." : "They'll appear here when someone reaches out."}
            />
          ) : (
            <div className="border border-trevo-border rounded-lg overflow-hidden bg-trevo-surface">
              {filtered.map((item: any) => {
                const otherUser = tab === "received" ? item.sender : item.recipient;
                const lastMsg = item.messages?.[0];
                return (
                  <InboxItem
                    key={item.id}
                    enquiryId={item.id}
                    subject={item.subject}
                    preview={lastMsg?.body || "No messages yet"}
                    senderName={otherUser?.username || "Unknown"}
                    senderAvatar={otherUser?.avatar}
                    unread={tab === "received" && item.status === "OPEN"}
                    time={formatRelative(item.updatedAt)}
                    onClick={() => router.push(`/inbox/${item.id}`)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
