// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";

interface WhatsAppBillButtonProps {
  orderId: string;
  phone: string;
  notify: (kind: "ok" | "err", text: string) => void;
  onPhoneRequired?: () => void;
  className?: string;
}

/**
 * POS "WhatsApp Bill" button for the payment-success flow.
 *
 * Transport abstraction: this component only talks to the async-outbox
 * endpoint `POST /api/whatsapp/send`. It never imports Baileys or the
 * WhatsAppProvider — the server queues the message and returns pending
 * immediately, so the POS is never blocked on delivery.
 */
export function WhatsAppBillButton({
  orderId,
  phone,
  notify,
  onPhoneRequired,
  className,
}: WhatsAppBillButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleClick() {
    if (isSending || sent) return;
    const recipient = (phone || "").trim();
    if (!recipient) {
      // Never send to an empty recipient — prompt for the phone first.
      if (onPhoneRequired) {
        onPhoneRequired();
      } else {
        notify("err", "Please enter the customer phone number first");
      }
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          phone: recipient,
          template_name: "bill_receipt",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      // Async outbox: queued immediately, worker delivers later.
      if (data.idempotent) {
        notify("ok", "Bill already sent via WhatsApp");
      } else {
        notify("ok", "Bill queued for WhatsApp");
      }
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to queue WhatsApp bill";
      // Button stays mounted — retry is the same idempotent call server-side.
      notify("err", `WhatsApp bill failed: ${message}. Tap to retry.`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSending || sent}
      className={
        className ||
        `py-2 px-2.5 rounded-xl ${
          sent
            ? "bg-emerald-600 cursor-default"
            : "bg-[#34C759] hover:bg-[#2EB84E] cursor-pointer"
        } disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs`
      }
    >
      <span>
        {sent ? "✓ Bill Sent" : isSending ? "Sending…" : "💬 WhatsApp Bill"}
      </span>
    </button>
  );
}
