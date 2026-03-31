import { AppDataSource } from "../../config/database";
import { Product } from "../../entity/Product";
import { ProductStatus } from "../../types/enums";
import { auctionQueue, notificationQueue } from "../../jobs/queues";
import { invalidatePattern } from "../../utils/cache";
import { redisConnection } from "../../config/redis";

const productRepo = AppDataSource.getRepository(Product);

export class ManagerService {
  async getPendingProducts() {
    const [products, total] = await productRepo.findAndCount({
      where: { status: ProductStatus.PENDING },
      order: { created_at: "DESC" },
    });

    return { data: products, total };
  }

  async updateProductStatus(
    productId: string,
    status: ProductStatus,
    reason?: string,
  ) {
    const product = await productRepo.findOne({
      where: { id: productId },
      relations: ["seller"],
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // ✅ Only allow transition from PENDING
    if (product.status !== ProductStatus.PENDING) {
      throw new Error("Only pending products can be updated");
    }

    // ✅ Handle APPROVAL
    if (status === ProductStatus.APPROVED) {
      if (new Date(product.bidding_end_time) <= new Date()) {
        throw new Error("Cannot approve expired product");
      }

      product.status = ProductStatus.APPROVED;
      await productRepo.save(product);

      // 🧠 Schedule auction end job
      const delay = new Date(product.bidding_end_time).getTime() - Date.now();

      if (delay > 0) {
        await auctionQueue.add(
          "end-auction",
          { productId: product.id },
          {
            delay,
            jobId: `auction-end-${productId}`,
            removeOnComplete: true,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
          },
        );
      }

      // 🔔 Notify seller
      await notificationQueue.add(
        "listing_approved",
        {
          type: "listing_approved",
          productId: product.id,
          sellerId: product.seller.id,
        },
        {
          jobId: `notification-${product.id}`,
          removeOnComplete: true,
        },
      );

      // 🧹 Cache invalidation
      await invalidatePattern("products:approved");
      await redisConnection.del(`product:${productId}`);

      return { message: "Product approved & auction scheduled" };
    }

    // ❌ Handle REJECTION
    if (status === ProductStatus.REJECTED) {
      product.status = ProductStatus.REJECTED;

      // (optional) you can store reason in DB if column exists
      // product.rejection_reason = reason;

      await productRepo.save(product);

      // 🔔 (optional) notify seller for rejection
      // await notificationQueue.add(...)

      await redisConnection.del(`product:${productId}`);

      return { message: "Product rejected" };
    }

    // ❌ Invalid status
    throw new Error("Invalid status update");
  }
}
