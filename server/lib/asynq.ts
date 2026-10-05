import crypto from "node:crypto";
import { getRedisClient } from "~~/server/db/redis";
import { logger } from "~~/server/utils/logger";

/**
 * Pure TypeScript Asynq client helper.
 * Compatible with github.com/hibiken/asynq without any third-party npm dependencies.
 */

export interface AsynqTaskMessage {
  type: string;
  payload: Buffer;
  id?: string;
  queue?: string;
  retry?: number;
  retried?: number;
  errorMsg?: string;
  timeout?: number;
  deadline?: number;
  uniqueKey?: string;
  lastFailedAt?: number;
  retention?: number;
  completedAt?: number;
  groupKey?: string;
}

export interface AsynqScheduleOptions {
  queue?: string;
  processAt?: Date;
  retry?: number;
  timeoutSeconds?: number;
}

// Protobuf wire format helpers (wire types 0 = varint, 2 = length-delimited)
function encodeVarint(val: number | bigint): Buffer {
  let v = BigInt(val);
  const bytes: number[] = [];
  const mask = BigInt(0x7f);
  const cont = BigInt(0x80);
  const shift = BigInt(7);

  while (v >= cont) {
    bytes.push(Number((v & mask) | cont));
    v >>= shift;
  }
  bytes.push(Number(v & mask));
  return Buffer.from(bytes);
}

function encodeString(fieldNum: number, str: string | undefined): Buffer {
  if (!str) return Buffer.alloc(0);
  const tag = (fieldNum << 3) | 2;
  const strBuf = Buffer.from(str, "utf8");
  return Buffer.concat([encodeVarint(tag), encodeVarint(strBuf.length), strBuf]);
}

function encodeBytes(fieldNum: number, buf: Buffer | Uint8Array | undefined): Buffer {
  if (!buf || buf.length === 0) return Buffer.alloc(0);
  const tag = (fieldNum << 3) | 2;
  const raw = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return Buffer.concat([encodeVarint(tag), encodeVarint(raw.length), raw]);
}

function encodeInt(fieldNum: number, val: number | bigint | undefined): Buffer {
  if (!val || Number(val) === 0) return Buffer.alloc(0);
  const tag = (fieldNum << 3) | 0;
  return Buffer.concat([encodeVarint(tag), encodeVarint(val)]);
}

/**
 * Serializes TaskMessage matching github.com/hibiken/asynq/internal/proto/asynq.proto
 */
export function encodeTaskMessage(msg: AsynqTaskMessage): Buffer {
  return Buffer.concat([
    encodeString(1, msg.type),
    encodeBytes(2, msg.payload),
    encodeString(3, msg.id),
    encodeString(4, msg.queue || "default"),
    encodeInt(5, msg.retry ?? 25),
    encodeInt(6, msg.retried ?? 0),
    encodeString(7, msg.errorMsg ?? ""),
    encodeInt(8, msg.timeout ?? 1800),
    encodeInt(9, msg.deadline ?? 0),
    encodeString(10, msg.uniqueKey ?? ""),
    encodeInt(11, msg.lastFailedAt ?? 0),
    encodeInt(12, msg.retention ?? 0),
    encodeInt(13, msg.completedAt ?? 0),
    encodeString(14, msg.groupKey ?? ""),
  ]);
}

/**
 * Enqueue or schedule a task in Redis using Asynq's exact schema
 */
export async function enqueueAsynqTask(
  type: string,
  payload: Record<string, any> | Buffer | string,
  options: AsynqScheduleOptions = {}
): Promise<string | null> {
  const client = getRedisClient();
  if (!client) {
    logger.warn("[asynq] Redis client not connected. Skipping task enqueue.");
    return null;
  }

  const taskId = crypto.randomUUID();
  const queue = options.queue || "default";

  let payloadBuffer: Buffer;
  if (Buffer.isBuffer(payload)) {
    payloadBuffer = payload;
  } else if (typeof payload === "string") {
    payloadBuffer = Buffer.from(payload, "utf8");
  } else {
    payloadBuffer = Buffer.from(JSON.stringify(payload), "utf8");
  }

  const encoded = encodeTaskMessage({
    type,
    payload: payloadBuffer,
    id: taskId,
    queue,
    retry: options.retry ?? 25,
    timeout: options.timeoutSeconds ?? 1800,
  });

  const taskKey = `asynq:{${queue}}:t:${taskId}`;
  const scheduledKey = `asynq:{${queue}}:scheduled`;
  const pendingKey = `asynq:{${queue}}:pending`;

  try {
    await client.sAdd("asynq:queues", queue);

    const nowSeconds = Math.floor(Date.now() / 1000);
    const processAtSeconds = options.processAt
      ? Math.floor(options.processAt.getTime() / 1000)
      : nowSeconds;

    if (processAtSeconds > nowSeconds) {
      // Schedule future task
      await client.hSet(taskKey, {
        msg: encoded,
        state: "scheduled",
      });
      await client.zAdd(scheduledKey, [{ score: processAtSeconds, value: taskId }]);
      logger.info(
        { taskId, queue, type, processAt: options.processAt?.toISOString() },
        `[asynq] Scheduled future task "${type}"`
      );
    } else {
      // Immediate pending task
      await client.hSet(taskKey, {
        msg: encoded,
        state: "pending",
      });
      await client.lPush(pendingKey, taskId);
      logger.info({ taskId, queue, type }, `[asynq] Enqueued immediate task "${type}"`);
    }

    return taskId;
  } catch (err: any) {
    logger.error({ err, taskId, type }, "[asynq] Failed to enqueue task to Redis");
    return null;
  }
}

/**
 * Schedule automatic revocation of a beta tester when their 14-day access expires.
 * Calls "task:http_post" handled by Asynq worker to invoke the portfolio worker endpoint.
 */
export async function scheduleBetaTesterExpiration(
  testerId: string,
  expiresAt: Date
): Promise<string | null> {
  const config = useRuntimeConfig();
  const workerBaseUrl = config.jobWorkerUrl || "http://localhost:9090";
  const workerSecret = config.jobWorkerSecret || "";

  // The worker HTTP endpoint to receive the expiration trigger
  const revokeUrl = `${workerBaseUrl.replace(/\/+$/, "")}/apk/testers/revoke`;

  // Payload for "task:http_post" expected by user's Asynq worker
  const httpPayload = {
    url: revokeUrl,
    body: JSON.stringify({
      testerId,
      secret: workerSecret,
    }),
  };

  logger.info(
    { testerId, expiresAt: expiresAt.toISOString(), revokeUrl },
    "[asynq] Scheduling beta tester expiration task via Asynq"
  );

  return await enqueueAsynqTask("task:http_post", httpPayload, {
    processAt: expiresAt,
    retry: 5,
    timeoutSeconds: 60,
  });
}
