"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  EnquiryThread, Button, Skeleton, EmptyState, TierBadge,
  StatusBadge, Textarea, Card,
} from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { ChevronLeft, Send, Mail, Archive } from "lucide-react";

export default function EnquiryDetailPage() {
  const { enquiryId } = useParams<{ enquiryId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const enquiry = trpc.enquiry.getEnquiry.useQuery({ enquiryId });
  const markRead = trpc.enquiry.markRead.useMutation();
  const sendReply = trpc.enquiry.replyEnquiry.useMutation({
    onSuccess: () => {
      setReply("");
      enquiry.refetch();
    },
  });
  const archiveEnquiry = trpc.enquiry.archiveEnquiry.useMutation({
    onSuccess: () => router.push("/inbox"),
  });

  useEffect(() => {
    if (enquiry.data && session?.user) {
      const isRecipient = enquiry.data.recipient.id === session.user.id;
      if (isRecipient && enquiry.data.status === "OPEN") {
        markRead.mutate({ enquiryId });
      }
    }
  }, [enquiry.data, session?.user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [enquiry.data?.messages.length]);

  if (enquiry.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-96" />
          <Skeleton className="h-64" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!enquiry.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 flex-1">
          <EmptyState icon={Mail} title="Enquiry not found" description="This enquiry doesn't exist or you don't have access." />
        </div>
        <Footer />
      </div>
    );
  }

  const e = enquiry.data;
  const otherUser = session?.user?.id === e.sender.id ? e.recipient : e.sender;
  const currentUserId = session?.user?.id || "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => router.push("/inbox")} className="text-trevo-text-muted hover:text-trevo-text transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="font-heading font-semibold text-lg truncate">{e.subject}</h1>
                <StatusBadge status={e.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-trevo-text-muted">
                <span>with <Link href={`/builders/${otherUser.username}`} className="text-trevo-accent hover:underline">@{otherUser.username}</Link></span>
                {otherUser.tier && <TierBadge tier={otherUser.tier as "SEED"} size="xs" />}
                {e.listing && (
                  <>
                    <span>·</span>
                    <Link href={`/registry/${e.listing.slug}`} className="text-trevo-accent hover:underline">
                      re: {e.listing.name}
                    </Link>
                  </>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => archiveEnquiry.mutate({ enquiryId })} title="Archive">
              <Archive size={14} />
            </Button>
          </div>

          {/* Thread */}
          <Card className="p-4 mb-4">
            <EnquiryThread
              messages={e.messages.map((m: any) => ({
                id: m.id,
                body: m.body,
                createdAt: m.createdAt,
                readAt: m.readAt,
                author: m.author,
              }))}
              currentUserId={currentUserId}
            />
            <div ref={bottomRef} />
          </Card>

          {/* Reply composer */}
          {e.status !== "ARCHIVED" && e.status !== "CLOSED" && (
            <div className="flex gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 min-h-[80px]"
                maxLength={2000}
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => sendReply.mutate({ enquiryId, body: reply })}
                disabled={!reply.trim() || sendReply.isPending}
                className="self-end shrink-0"
              >
                <Send size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
