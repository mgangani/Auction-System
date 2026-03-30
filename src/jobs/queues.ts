import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";
import { AuctionEndJobData, NotificationJobData } from "./job.types";


export const auctionQueue = new Queue<AuctionEndJobData>(
  "auction-queue",
    {
        connection: redisConnection,
    }
);

export const notificationQueue = new Queue<NotificationJobData>(
    "notification-queue",
    {
        connection: redisConnection,
    }
);