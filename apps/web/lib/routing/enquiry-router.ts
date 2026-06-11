import { db } from "@/lib/db";
import { addJob } from "@/lib/queue";
import { runEnquiryRouterAgent } from "@/lib/agents/verification";
import { sendEmail, enquiryReceivedEmail, bookingRequestEmail, bookingAcceptedEmail } from "@/lib/email/templates";

export async function processEnquirySubmission(enquiryId: string) {
  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    include: {
      sender: { select: { username: true, displayName: true } },
      recipient: { select: { username: true, displayName: true, email: true } },
      messages: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });
  if (!enquiry || !enquiry.messages[0]) return;

  const screening = await runEnquiryRouterAgent(
    enquiry.subject,
    enquiry.messages[0].body,
    enquiry.sender.username
  );

  if (screening.isSpam || screening.isInappropriate) {
    await db.enquiry.update({ where: { id: enquiryId }, data: { status: "ARCHIVED" } });
    return { held: true, flags: screening.flags };
  }

  const emailPayload = enquiryReceivedEmail(
    enquiry.recipient.displayName || enquiry.recipient.username,
    enquiry.sender.displayName || enquiry.sender.username,
    enquiry.subject,
    enquiry.messages[0].body
  );

  await sendEmail({ to: enquiry.recipient.email, ...emailPayload });

  await addJob("ENQUIRY_REMINDER", { enquiryId }, { delay: 48 * 60 * 60 * 1000 });

  return { held: false };
}

export async function processBookingSubmission(bookingId: string) {
  const booking = await db.bookingRequest.findUnique({
    where: { id: bookingId },
    include: {
      requester: { select: { username: true, displayName: true } },
      builder: { select: { username: true, displayName: true, email: true } },
    },
  });
  if (!booking) return;

  const emailPayload = bookingRequestEmail(
    booking.builder.displayName || booking.builder.username,
    booking.requester.displayName || booking.requester.username,
    booking.purpose,
    booking.preferredDate.toLocaleDateString(),
    booking.preferredTime
  );

  await sendEmail({ to: booking.builder.email, ...emailPayload });
}

export async function processBookingResponse(bookingId: string) {
  const booking = await db.bookingRequest.findUnique({
    where: { id: bookingId },
    include: {
      requester: { select: { username: true, displayName: true, email: true } },
      builder: { select: { username: true, displayName: true } },
    },
  });
  if (!booking || booking.status === "PENDING") return;

  if (booking.status === "ACCEPTED") {
    const emailPayload = bookingAcceptedEmail(
      booking.requester.displayName || booking.requester.username,
      booking.builder.displayName || booking.builder.username,
      booking.scheduledAt?.toLocaleString()
    );
    await sendEmail({ to: booking.requester.email, ...emailPayload });
  }
}

export function generateIcsFile(title: string, dateTime: Date, durationMinutes: number, attendees: string[]) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDt = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const start = formatDt(dateTime);
  const end = formatDt(new Date(dateTime.getTime() + durationMinutes * 60000));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TREVO//Booking//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Booked via TREVO`,
    ...attendees.map((a) => `ATTENDEE:mailto:${a}`),
    `UID:${Date.now()}@trevo.ai`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
