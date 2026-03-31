import { AppDataSource } from "../../config/database";
import { Product } from "../../entity/Product";
import { ProductStatus } from "../../types/enums";
import { auctionQueue, notificationQueue } from "../../jobs/queues";

const productRepo = AppDataSource.getRepository(Product);

export class ManagerService {
  async getPendingProducts() {
    const [products, total] = await productRepo.findAndCount({
      where: { status: ProductStatus.PENDING },
      order: { created_at: "DESC" },
    });

    return { data: products, total };
  }

  async approveProduct(productId: string) {
    const product = await productRepo.findOne({
      where: { id: productId },
      relations: ["seller"],
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.status !== ProductStatus.PENDING) {
      throw new Error("Only pending products can be approved");
    }

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

    return { message: "Product approved & auction scheduled" };
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

    await productRepo.save(product);

    return { message: "Product rejected" };
  }
}
