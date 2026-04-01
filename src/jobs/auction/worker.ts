import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis";
import { ProductService } from "../../modules/products/product.service";
import { auctionQueue } from "./queue";

const productService = new ProductService();

export const auctionWorker = new Worker(
  auctionQueue.name,
  async (job) => {
    if (job.name !== "end-auction") return;

    const { productId } = job.data;

    console.log(`⏳ Ending auction for ${productId}`);

    await productService.processAuctionEnd(productId);
  },
  {
    connection: redisConnection,
    concurrency: 2,
    // autorun: false,
  },
);
