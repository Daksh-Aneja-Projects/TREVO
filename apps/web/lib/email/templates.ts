interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set, skipping email");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "TREVO <noreply@trevo.ai>",
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html || wrapHtml(payload.subject, payload.text || ""),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email send failed: ${res.status} ${err}`);
  }
}

function wrapHtml(subject: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 20px;background:#FAFAF8;font-family:'DM Sans',system-ui,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:40px">
    <div style="margin-bottom:24px">
      <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:20px;color:#1A1A1E;letter-spacing:-0.5px">TREVO</span>
    </div>
    <h2 style="font-family:'Syne',sans-serif;font-size:18px;color:#1A1A1E;margin:0 0 16px">${subject}</h2>
    <p style="font-size:15px;line-height:1.6;color:#3C3C43;margin:0 0 24px">${body}</p>
    <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin:24px 0">
    <p style="font-size:12px;color:#8E8E93;margin:0">You received this because of your TREVO account activity.</p>
  </div>
</body>
</html>`;
}

export function enquiryReceivedEmail(recipientName: string, senderName: string, subject: string, previewBody: string) {
  return {
    subject: `New enquiry from ${senderName}: ${subject}`,
    html: wrapHtml(`New enquiry from ${senderName}`, `
      <p>Hi ${recipientName},</p>
      <p><strong>${senderName}</strong> sent you an enquiry on TREVO:</p>
      <div style="background:#FAFAF8;border:1px solid rgba(0,0,0,0.06);border-radius:8px;padding:16px;margin:16px 0">
        <p style="font-weight:600;margin:0 0 8px">${subject}</p>
        <p style="color:#636366;margin:0">${previewBody.slice(0, 200)}${previewBody.length > 200 ? "…" : ""}</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/inbox" style="display:inline-block;background:#A8B88C;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">View in Inbox</a>
    `),
  };
}

export function bookingRequestEmail(builderName: string, requesterName: string, purpose: string, date: string, time: string) {
  return {
    subject: `Booking request from ${requesterName}`,
    html: wrapHtml(`New booking request`, `
      <p>Hi ${builderName},</p>
      <p><strong>${requesterName}</strong> wants to book a call with you:</p>
      <div style="background:#FAFAF8;border:1px solid rgba(0,0,0,0.06);border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px"><strong>Purpose:</strong> ${purpose}</p>
        <p style="margin:0 0 8px"><strong>Preferred date:</strong> ${date}</p>
        <p style="margin:0"><strong>Preferred time:</strong> ${time}</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="display:inline-block;background:#A8B88C;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Respond</a>
    `),
  };
}

export function bookingAcceptedEmail(requesterName: string, builderName: string, scheduledAt?: string) {
  return {
    subject: `${builderName} accepted your booking!`,
    html: wrapHtml(`Booking accepted`, `
      <p>Hi ${requesterName},</p>
      <p>Great news — <strong>${builderName}</strong> has accepted your booking request.</p>
      ${scheduledAt ? `<p>Scheduled for: <strong>${scheduledAt}</strong></p>` : ""}
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="display:inline-block;background:#A8B88C;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">View Details</a>
    `),
  };
}

export function listingVerifiedEmail(builderName: string, listingName: string, isPioneer: boolean) {
  const pioneerSection = isPioneer
    ? `<div style="background:#F0F4E8;border:1px solid #A8B88C;border-radius:8px;padding:16px;margin:16px 0">
        <p style="font-weight:700;margin:0 0 8px">🏔️ You're a TREVO Pioneer!</p>
        <p style="margin:0;color:#636366">As one of the first 10 verified listers, you've earned: Pioneer badge, instant PROVEN tier, permanent featured placement, and a spot on the Founding Wall.</p>
      </div>`
    : "";
  return {
    subject: `✓ "${listingName}" is now verified on TREVO`,
    html: wrapHtml(`Your listing is verified`, `
      <p>Hi ${builderName},</p>
      <p>Your listing <strong>"${listingName}"</strong> has passed all verification stages and is now live on TREVO.</p>
      ${pioneerSection}
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/registry" style="display:inline-block;background:#A8B88C;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">View Your Listing</a>
    `),
  };
}
