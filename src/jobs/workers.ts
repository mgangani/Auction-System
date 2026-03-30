import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { AppDataSource } from "../config/database";
import { Product } from "../entity/Product";
import { Bid } from "../entity/Bid";
import { ProductStatus } from "../types/enums";

export const auctionWorker = new Worker(
  "auction-queue",
  async (job) => {
    console.log("Auction worker started");
    const { productId } = job.data;
    console.log("Processing Auction End Job for Product:", productId);

    const productRepo = AppDataSource.getRepository(Product);
    const bidRepo = AppDataSource.getRepository(Bid);

    const product = await productRepo.findOne({
      where: { id: productId },
      relations: ["bids"],
    });

    if (!product) {
      console.error("Product not found:", productId);
      return;
    }

    if (product.status !== ProductStatus.APPROVED) {
      console.error("Product is not approved:", productId);
      return;
    }

    const highestBid = await bidRepo
      .createQueryBuilder("bid")
      .where("bid.product_id = :productId", { productId })
      .orderBy("bid.amount", "DESC")
      .getOne();

    if (!highestBid) {
      console.error("No bids found for product:", productId);
      return;
    }

    product.status = ProductStatus.SOLD;
    product.winner = { id: highestBid.bidder.id } as any;
    product.current_highest_bid = highestBid.amount;
    await productRepo.save(product);

    console.log("Aunction ended and winner is: ", highestBid.bidder.id);
  },
  {
    connection: redisConnection,
  },
);

export const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {
    console.log("Notification worker started");
    const data = job.data;

    console.log("Notification job:", data);

    // Example:
    // send email / push / websocket

    if (data.type === "listing_approved") {
      console.log(`Notify seller ${data.sellerId}`);
    }

    if (data.type === "auction_ended") {
      console.log(`Notify winner ${data.winnerId}`);
    }
  },
  {
    connection: redisConnection,
  },
);