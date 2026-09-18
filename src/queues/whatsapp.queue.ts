// Copyright (c) 2026 QRslice. All rights reserved.
import { Queue } from "bullmq";
import Redis from "ioredis";

let _redis: Redis | null = null;
let _queue: Queue | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    _redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
  }
  return _redis;
}

function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("whatsapp-send", {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: {
          age: 3600,
          count: 100,
        },
        removeOnFail: {
          age: 86400,
          count: 100,
        },
      },
    });
  }
  return _queue;
}

export const redis = getRedis();
export const whatsappQueue = getQueue();

export function __setRedisForTest(redis: Redis): void {
  _redis = redis;
  _queue = new Queue("whatsapp-send", {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600,
        count: 100,
      },
      removeOnFail: {
        age: 86400,
        count: 100,
      },
    },
  });
}

export async function closeQueue(): Promise<void> {
  if (_queue) {
    await _queue.close();
    _queue = null;
  }
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}