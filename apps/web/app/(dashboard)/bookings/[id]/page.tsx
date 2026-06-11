"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  BookingStatusBadge, TierBadge, Button, Skeleton, EmptyState, Card,
  SectionHeader, Textarea, Input,
} from "@/components/ui";
import { formatDate, formatRelative } from "@/lib/utils";
import { Calendar, ChevronLeft, Clock, User, CheckCircle, XCircle } from "lucide-react";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [note, setNote] = useState("");

  const booking = trpc.booking.getBooking.useQuery({ id });
  const respondMutation = trpc.booking.respondBooking.useMutation({
    onSuccess: () => booking.refetch(),
  });
  const cancelMutation = trpc.booking.cancelBooking.useMutation({
    onSuccess: () => booking.refetch(),
  });

  if (booking.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 flex-1">
          <EmptyState icon={Calendar} title="Booking not found" />
        </div>
        <Footer />
      </div>
    );
  }

  const b = booking.data;
  const isHost = session?.user?.id === b.builder?.id;
  const isRequester = session?.user?.id === b.requester?.id;
  const otherUser = isHost ? b.requester : b.builder;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={() => router.push("/bookings")} className="flex items-center gap-1 text-xs text-trevo-text-muted hover:text-trevo-text mb-6 transition-colors">
            <ChevronLeft size={14} /> Back to Bookings
          </button>

          <div className="flex items-center gap-3 mb-6">
            <Calendar size={20} className="text-trevo-accent" />
            <h1 className="font-display text-2xl font-bold">Booking Request</h1>
            <BookingStatusBadge status={b.status} />
          </div>

          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-trevo-text-muted" />
                  <span className="text-sm text-trevo-text-secondary">{isHost ? "Requested by" : "Host"}</span>
                  <Link href={`/builders/${otherUser?.username}`} className="text-sm text-trevo-accent hover:underline font-medium">
                    @{otherUser?.username}
                  </Link>
                  {otherUser?.tier && <TierBadge tier={otherUser.tier as "SEED"} size="xs" />}
                </div>
                <span className="text-[10px] font-mono text-trevo-text-muted">{formatRelative(b.createdAt)}</span>
              </div>

              {b.listing && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-trevo-text-muted">Re:</span>
                  <Link href={`/registry/${b.listing.slug}`} className="text-trevo-accent hover:underline">{b.listing.name}</Link>
                </div>
              )}

              <div>
                <h3 className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider mb-1">Purpose</h3>
                <p className="text-sm text-trevo-text-secondary leading-relaxed">{b.purpose}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border border-trevo-border rounded-lg bg-trevo-surface-2">
                  <div className="text-[10px] font-mono text-trevo-text-muted uppercase mb-0.5">Date</div>
                  <div className="text-sm font-heading font-medium">{formatDate(b.preferredDate)}</div>
                </div>
                <div className="p-3 border border-trevo-border rounded-lg bg-trevo-surface-2">
                  <div className="text-[10px] font-mono text-trevo-text-muted uppercase mb-0.5">Time</div>
                  <div className="text-sm font-heading font-medium">{b.preferredTime}</div>
                </div>
                <div className="p-3 border border-trevo-border rounded-lg bg-trevo-surface-2">
                  <div className="text-[10px] font-mono text-trevo-text-muted uppercase mb-0.5">Timezone</div>
                  <div className="text-sm font-heading font-medium">{b.timezone}</div>
                </div>
              </div>

              {b.notes && (
                <div>
                  <h3 className="text-xs font-mono text-trevo-text-muted uppercase tracking-wider mb-1">Notes</h3>
                  <p className="text-sm text-trevo-text-secondary">{b.notes}</p>
                </div>
              )}

              {b.builderNote && (
                <div className="p-3 border border-trevo-accent/20 bg-trevo-accent/5 rounded-lg">
                  <h3 className="text-xs font-mono text-trevo-accent uppercase tracking-wider mb-1">Host Response</h3>
                  <p className="text-sm text-trevo-text-secondary">{b.builderNote}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          {isHost && b.status === "PENDING" && (
            <Card className="p-6 mb-6">
              <h3 className="font-heading font-semibold mb-3">Respond to Booking</h3>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)..." className="mb-4 min-h-[80px]" maxLength={500} />
              <div className="flex gap-2">
                <Button variant="primary" className="gap-1.5"
                  onClick={() => respondMutation.mutate({ id: b.id, status: "ACCEPTED", builderNote: note || undefined })}
                  disabled={respondMutation.isPending}>
                  <CheckCircle size={14} /> Accept
                </Button>
                <Button variant="ghost" className="gap-1.5 text-trevo-danger"
                  onClick={() => respondMutation.mutate({ id: b.id, status: "DECLINED", builderNote: note || undefined })}
                  disabled={respondMutation.isPending}>
                  <XCircle size={14} /> Decline
                </Button>
              </div>
            </Card>
          )}

          {(isRequester || isHost) && !["COMPLETED", "CANCELLED"].includes(b.status) && (
            <Button variant="ghost" size="sm"
              onClick={() => cancelMutation.mutate({ id: b.id })}
              disabled={cancelMutation.isPending}>
              Cancel Booking
            </Button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
