import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis";
import { NotificationService } from "../../modules/notifications/notification.service";
import { notificationQueue } from "./queue";
import type { NotificationJobData } from "./types";

const notificationService = new NotificationService();

export const notificationWorker = new Worker(
  notificationQueue.name,
  async (job) => {
    const data = job.data as NotificationJobData;

    console.log("Notification worker received job", data);

    notificationService.dispatch(data);
  },
  {
    connection: redisConnection,
  },
);
