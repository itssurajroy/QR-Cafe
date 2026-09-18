// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("ioredis", () => {
  class MockRedis {
    on = vi.fn();
    quit = vi.fn().mockResolvedValue(undefined);
  }
  return {
    __esModule: true,
    default: MockRedis,
  };
});

vi.mock("bullmq", () => {
  const mockJob = {
    id: "job-1",
    name: "send",
    data: { messageId: "test-uuid-123" },
  };

  class MockQueue {
    add = vi.fn().mockResolvedValue(mockJob);
    getWaiting = vi.fn().mockResolvedValue([mockJob]);
    close = vi.fn().mockResolvedValue(undefined);
  }

  return {
    __esModule: true,
    Queue: MockQueue,
    Worker: vi.fn(),
  };
});

import { whatsappQueue, closeQueue } from "@/queues/whatsapp.queue";

describe("WhatsApp Queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await closeQueue();
  });

  it("adds a send job to the queue", async () => {
    await whatsappQueue.add("send", { messageId: "test-uuid-123" });
    const jobs = await whatsappQueue.getWaiting();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].data).toEqual({ messageId: "test-uuid-123" });
    expect(jobs[0].name).toBe("send");
  });
});