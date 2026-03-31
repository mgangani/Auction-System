import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { AppDataSource } from "../config/database";
import { Product } from "../entity/Product";
import { Bid } from "../entity/Bid";
import { ProductStatus } from "../types/enums";
import { notificationQueue } from "./queues";
import { getIO } from "../sockets";
import { invalidatePattern } from "../utils/cache";

export const auctionWorker = new Worker(
  "auction-queue",
  async (job) => {
    if (job.name !== "end-auction") return;

    const { productId } = job.data;

    console.log(`⏳ Ending auction for ${productId}`);

    const productRepo = AppDataSource.getRepository(Product);
    const bidRepo = AppDataSource.getRepository(Bid);

    const product = await productRepo.findOne({
      where: { id: productId },
      relations: ["seller"],
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.status !== ProductStatus.APPROVED) {
      console.log("Already processed or not eligible");
      return;
    }

    const highestBid = await bidRepo
      .createQueryBuilder("bid")
      .leftJoinAndSelect("bid.bidder", "bidder")
      .where("bid.product_id = :productId", { productId })
      .orderBy("bid.amount", "DESC")
      .getOne();

    if (highestBid) {
      product.status = ProductStatus.SOLD;
      product.winner = { id: highestBid.bidder.id } as any;
      product.current_highest_bid = Number(highestBid.amount);

      await productRepo.save(product);
      await redisConnection.del(`product:${productId}`);
      await redisConnection.del(`highest_bid:${productId}`);
      await invalidatePattern("products:approved");

      console.log(`✅ Sold to ${highestBid.bidder.id}`);

      await notificationQueue.add("notify", {
        type: "auction_ended",
        productId,
        sellerId: product.seller.id,
        winnerId: highestBid.bidder.id,
        finalAmount: Number(highestBid.amount),
      });
    } else {
      product.status = ProductStatus.EXPIRED;
      await productRepo.save(product);
      await redisConnection.del(`product:${productId}`);
      await redisConnection.del(`highest_bid:${productId}`);
      await invalidatePattern("products:approved");

      console.log("❌ No bids — auction expired");

      await notificationQueue.add("notify", {
        type: "auction_ended",
        productId,
        sellerId: product.seller.id,
      });
    }
  },
  {
    connection: redisConnection,
  },
);
export const notificationWorker = new Worker(
  "notification-queue",
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