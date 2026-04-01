import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis";
import type { NotificationJobData } from "./types";

export const notificationQueue = new Queue<NotificationJobData>(
  "notification-queue",
  {
    connection: redisConnection,
  },
);
