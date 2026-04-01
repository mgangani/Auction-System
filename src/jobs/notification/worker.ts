import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis";
import { getIO } from "../../sockets";
import { notificationQueue } from "./queue";

export const notificationWorker = new Worker(
  notificationQueue.name,
  async (job) => {
    const io = getIO();
    const data = job.data;

    if (data.type === "listing_approved") {
      io.to(`user:${data.sellerId}`).emit("listing_approved", {
        productId: data.productId,
      });
    }

    if (data.type === "auction_ended") {
      if (data.winnerId) {
        io.to(`user:${data.winnerId}`).emit("auction_won", {
          productId: data.productId,
          amount: data.finalAmount!,
        });
      }

      io.to(`user:${data.sellerId}`).emit("product_sold", {
        productId: data.productId,
        amount: data.finalAmount,
      });
    }
  },
  {
    connection: redisConnection,
  },
);
