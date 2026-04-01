import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis";
import { AppDataSource } from "../../config/database";
import { Product } from "../../entity/Product";
import { Bid } from "../../entity/Bid";
import { ProductStatus } from "../../types/enums";
import { notificationQueue } from "../notification/queue";
import { invalidatePattern } from "../../utils/cache";
import { auctionQueue } from "./queue";

export const auctionWorker = new Worker(
  auctionQueue.name,
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
    concurrency: 2,
  },
);
