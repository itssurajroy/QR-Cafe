// @vitest-environment jsdom
// Copyright (c) 2026 QRslice. All rights reserved.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WhatsAppBillButton } from "@/features/pos/WhatsAppBillButton";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const ORDER_ID = "123e4567-e89b-12d3-a456-426614174000";

function stubFetch(handler: (url: unknown, init?: { method?: string; body?: string }) => unknown) {
  const fetchMock = vi.fn(async (url: unknown, init?: { method?: string; body?: string }) => handler(url, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function stubFetchOk(payload: unknown = {}) {
  return stubFetch(async () => ({ ok: true, status: 200, json: async () => payload }));
}

// Mimics the POS payment-success action row: Print Bill / PDF Bill / WhatsApp Bill.
function renderSuccessRow(props: Partial<React.ComponentProps<typeof WhatsAppBillButton>> = {}) {
  const notify = vi.fn();
  const onPhoneRequired = vi.fn();
  render(
    <div>
      <button type="button"><span>Print Bill</span></button>
      <button type="button"><span>PDF Bill</span></button>
      <WhatsAppBillButton
        orderId={ORDER_ID}
        phone="9876543210"
        notify={notify}
        onPhoneRequired={onPhoneRequired}
        {...props}
      />
    </div>
  );
  return { notify, onPhoneRequired };
}

describe("POS payment-success WhatsApp Bill button (Task 10b)", () => {
  it("renders a WhatsApp Bill button alongside Print Bill / PDF Bill", () => {
    renderSuccessRow();
    expect(screen.getByText("Print Bill")).not.toBeNull();
    expect(screen.getByText("PDF Bill")).not.toBeNull();
    expect(screen.getByRole("button", { name: /WhatsApp Bill/i })).not.toBeNull();
  });

  it("POSTs { order_id, phone, template_name } and toasts queued immediately on 200", async () => {
    const fetchMock = stubFetchOk({ messageId: "msg-1", status: "pending" });
    const { notify } = renderSuccessRow();

    fireEvent.click(screen.getByRole("button", { name: /WhatsApp Bill/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/whatsapp/send");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      order_id: ORDER_ID,
      phone: "9876543210",
      template_name: "bill_receipt",
    });

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith("ok", "Bill queued for WhatsApp");
    });
  });

  it("prompts for phone first and never sends to an empty recipient", async () => {
    const fetchMock = stubFetchOk({ messageId: "msg-1", status: "pending" });
    const { notify, onPhoneRequired } = renderSuccessRow({ phone: "  " });

    fireEvent.click(screen.getByRole("button", { name: /WhatsApp Bill/i }));

    await waitFor(() => {
      expect(onPhoneRequired).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalledWith("ok", "Bill queued for WhatsApp");
  });

  it("surfaces server errors and offers Retry via the same idempotent call", async () => {
    let calls = 0;
    const fetchMock = stubFetch(async () => {
      calls += 1;
      if (calls === 1) {
        return { ok: false, status: 500, json: async () => ({ error: "queue full" }) };
      }
      return { ok: true, status: 200, json: async () => ({ messageId: "msg-1", status: "pending" }) };
    });
    const { notify } = renderSuccessRow();

    const btn = screen.getByRole("button", { name: /WhatsApp Bill/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith("err", expect.stringContaining("queue full"));
    });
    // Button stays mounted so the cashier can retry the same idempotent call.
    expect(screen.getByRole("button", { name: /WhatsApp Bill/i })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /WhatsApp Bill/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith("ok", "Bill queued for WhatsApp");
    });
  });
});
