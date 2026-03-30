import { AppDataSource } from "../../config/database";
import { Product } from "../../entity/Product";
import { ProductStatus } from "../../types/enums";
// import { redisClient } from '../../config/redis';
// import { auctionQueue, notificationQueue } from '../../jobs/queues';

const productRepo = AppDataSource.getRepository(Product);

export class ManagerService {
  async getPendingProducts() {
    const [products, total] = await productRepo.findAndCount({
      where: { status: ProductStatus.PENDING },
    //   skip: (page - 1) * limit,
    //   take: limit,
      order: { created_at: "DESC" },
    });

    return { data: products, total};
  }

  async approveProduct(productId: string) {
    const product = await productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.status !== ProductStatus.PENDING) {
      throw new Error("Only pending products can be approved");
    }

    product.status = ProductStatus.APPROVED;

    await productRepo.save(product);

    // 🧠 Calculate delay for auction end job
    const delay = new Date(product.bidding_end_time).getTime() - Date.now();

    if (delay > 0) {
      /*
      await auctionQueue.add(
        'auction-end',
        { productId: product.id },
        {
          delay,
          jobId: `auction-end:${product.id}`,
        }
      );
      */
      console.log(`Scheduled auction end job for ${product.id}`);
    }

    // 🔔 Notification job
    /*
    await notificationQueue.add('listing_approved', {
      productId: product.id,
      sellerId: product.seller_id,
    });
    */

    // 🧹 Cache invalidation
    /*
    await redisClient.del(`product:${product.id}`);
    await redisClient.del('products:approved');
    */

    return { message: "Product approved" };
  }

  async rejectProduct(productId: string, reason?: string) {
    const product = await productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.status !== ProductStatus.PENDING) {
      throw new Error("Only pending products can be rejected");
    }

    product.status = ProductStatus.REJECTED;

    // Optional: store reason if you add column later
    // product.rejection_reason = reason;

    await productRepo.save(product);

    // 🧹 Cache invalidation
    /*
    await redisClient.del(`product:${product.id}`);
    await redisClient.del('products:approved');
    */

    return { message: "Product rejected" };
  }
}
