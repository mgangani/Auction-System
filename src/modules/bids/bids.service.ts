import { AppDataSource } from "../../config/database";
import { Product } from "../../entity/Product";
import { Bid } from "../../entity/Bid";
import { ProductStatus } from "../../types/enums";
import { getIO } from "../../sockets";
import { redisConnection } from "../../config/redis";
// import { redisClient } from '../../config/redis';
// import { io } from '../../sockets';

const productRepo = AppDataSource.getRepository(Product);
const bidRepo = AppDataSource.getRepository(Bid);

export class BidService {
  async placeBid(productId: string, userId: string, amount: number) {
    const product = await productRepo.findOne({
      where: { id: productId },
      relations: ["seller"],
    });

    if (!product) {
      throw this.error(404, "Product not found");
    }

    if (product.status !== ProductStatus.APPROVED) {
      throw this.error(400, "Product not approved");
    }

    // 3️⃣ Seller cannot bid
    if (product.seller?.id === userId) {
      throw this.error(400, "Seller cannot bid on own product");
    }

    const now = new Date();

    // 4️⃣ Auction not started
    if (now < new Date(product.bidding_start_time)) {
      throw this.error(400, "Auction not started");
    }

    // 5️⃣ Auction ended
    if (now > new Date(product.bidding_end_time)) {
      throw this.error(400, "Auction has ended");
    }

    // 6️⃣ Get highest bid (Redis + DB fallback)
    const currentHighest = await this.getHighestBid(product);

    // 7️⃣ Validate amount
    if (amount <= currentHighest) {
      throw this.error(400, `Bid must be greater than ${currentHighest}`);
    }

    // 8️⃣ TRANSACTION (atomic)
    await AppDataSource.transaction(async (manager) => {
      const bid = manager.create(Bid, {
        amount,
        product: { id: productId },
        bidder: { id: userId },
      });

      await manager.save(bid);

      await manager.update(Product, productId, {
        current_highest_bid: amount,
      });
    });
    await redisConnection.del(`product:${productId}`);

    // 9️⃣ Update Redis cache
    const cacheKey = `highest_bid:${productId}`;
    const ttlMs = new Date(product.bidding_end_time).getTime() - Date.now();

    if (ttlMs > 0) {
      const ttlSec = Math.floor(ttlMs / 1000);

      /*
      await redisClient.set(cacheKey, amount, { EX: ttlSec });
      */
    }

    const io = getIO();
    io.to(`auction:${productId}`).emit("new_bid", {
      productId,
      amount,
      userId,
    });
    // 🔟 Emit socket event
    /*
    io.to(`auction:${productId}`).emit("new_bid", {
      productId,
      amount,
      userId,
    });
    */

    return { message: "Bid placed successfully", amount };
  }

  async getBidHistory(productId: string, page: number, limit: number) {
    const product = await productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw this.error(404, "Product not found");
    }

    const [bids, total] = await bidRepo.findAndCount({
      where: { product: { id: productId } },
      relations: ["bidder"],
      order: { amount: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const maskedBids = bids.map((bid) => ({
      id: bid.id,
      amount: Number(bid.amount),
      created_at: bid.created_at,
      bidder: {
        id: bid.bidder?.id,
        name: this.maskName(bid.bidder?.name),
      },
    }));

    return {
      data: maskedBids,
      total,
      page,
      limit,
    };
  }

  async getHighestBid(product: Product): Promise<number> {
    const cacheKey = `highest_bid:${product.id}`;

    let cached: string | null = null;

    /*
    cached = await redisClient.get(cacheKey);
    */

    if (cached) {
      return Number(cached);
    }

    // DB fallback
    const result = await bidRepo
      .createQueryBuilder("bid")
      .select("MAX(bid.amount)", "max")
      .where("bid.product_id = :productId", {
        productId: product.id,
      })
      .getRawOne();

    const highest =
      result?.max !== null && result?.max !== undefined
        ? Number(result.max)
        : Number(product.starting_price);

    // set cache with TTL
    const ttlMs = new Date(product.bidding_end_time).getTime() - Date.now();

    if (ttlMs > 0) {
      const ttlSec = Math.floor(ttlMs / 1000);

      /*
      await redisClient.set(cacheKey, highest, { EX: ttlSec });
      */
    }

    return highest;
  }

  private maskName(name?: string) {
    if (!name) return "***";
    if (name.length <= 3) return name[0] + "***";
    return name.slice(0, 3) + "***";
  }

  private error(status: number, message: string) {
    const err: any = new Error(message);
    err.status = status;
    return err;
  }
}
