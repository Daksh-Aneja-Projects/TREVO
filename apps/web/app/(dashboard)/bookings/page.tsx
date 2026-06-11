"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Navbar, Footer } from "@/components/shared/layout";
import {
  BookingRequestCard, TabBar, Skeleton, EmptyState, Button,
} from "@/components/ui";
import { Calendar } from "lucide-react";

export default function BookingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [role, setRole] = useState<"HOST" | "REQUESTER">("HOST");

  const bookings = trpc.booking.listMyBookings.useQuery({ role });
  const respondMutation = trpc.booking.respondBooking.useMutation({
    onSuccess: () => bookings.refetch(),
  });
  const cancelMutation = trpc.booking.cancelBooking.useMutation({
    onSuccess: () => bookings.refetch(),
  });

  const items = bookings.data?.items || [];
  const pendingCount = items.filter((b: any) => b.status === "PENDING").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold">Bookings</h1>
            <p className="text-sm text-trevo-text-secondary mt-1">Manage your call requests</p>
          </div>

          <div className="mb-6">
            <TabBar
              tabs={[
                { key: "HOST", label: "Received", count: pendingCount || undefined },
                { key: "REQUESTER", label: "Sent" },
              ]}
              active={role}
              onChange={(k) => setRole(k as "HOST" | "REQUESTER")}
            />
          </div>

          {bookings.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={role === "HOST" ? "No booking requests" : "No sent bookings"}
              description={role === "HOST" ? "When someone wants to book a call, it'll appear here." : "You haven't requested any bookings yet."}
            />
          ) : (
            <div className="space-y-3">
              {items.map((booking: any) => (
                <BookingRequestCard
                  key={booking.id}
                  purpose={booking.purpose}
                  preferredDate={booking.preferredDate}
                  preferredTime={booking.preferredTime}
                  timezone={booking.timezone}
                  status={booking.status}
                  requester={booking.requester}
                  builder={booking.builder}
                  listing={booking.listing}
                  notes={booking.notes}
                  builderNote={booking.builderNote}
                  createdAt={booking.createdAt}
                  isHost={role === "HOST"}
                  onAccept={() => respondMutation.mutate({ id: booking.id, status: "ACCEPTED" })}
                  onDecline={() => respondMutation.mutate({ id: booking.id, status: "DECLINED" })}
                  onCancel={() => cancelMutation.mutate({ id: booking.id })}
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
