import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis";
import type { AuctionEndJobData } from "./types";

export const auctionQueue = new Queue<AuctionEndJobData>("auction-queue", {
  connection: redisConnection,
});
