import { AppDataSource } from "../../config/database";
import { Bid } from "../../entity/Bid";
import { Product } from "../../entity/Product";
import { ProductStatus } from "../../types/enums";
// import { redisClient } from '../../config/redis'; // later
import { CreateProductDto } from "./products.dto";

const productRepo = AppDataSource.getRepository(Product);

export class ProductService {
  async getApprovedProducts() {
    // const cacheKey = `products:approved`;

    /*
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);
  */

    const products = await productRepo.find({
      where: { status: ProductStatus.APPROVED },
      order: { created_at: "DESC" },
    });

    /*
  await redisClient.set(cacheKey, JSON.stringify(products), {
    EX: 60,
  });
  */

    return products;
  }

  async getProductById(id: string) {
    // const cacheKey = `product:${id}`;

    /*
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
    */

    const product = await productRepo.findOne({
      where: { id, status: ProductStatus.PENDING },
      relations: ["bids"],
    });

    if (!product) {
      throw new Error("Product not found");
    }

    console.log("product: ", product);

    const highestBid =
      product.bids?.length > 0
        ? Math.max(...product.bids.map((b: Bid) => b.amount))
        : product.starting_price;

    const result = {
      ...product,
      current_highest_bid: highestBid,
    };

    /*
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 60 });
    */

    return result;
  }

  async createProduct(userId: string, dto: CreateProductDto, file?: any) {
    const product = productRepo.create({
      name: dto.name,
      description: dto.description,
      starting_price: dto.starting_price,
      current_highest_bid: dto.starting_price,
      bidding_start_time: dto.bidding_start_time,
      bidding_end_time: dto.bidding_end_time,
      seller: { id: userId },
      status: ProductStatus.PENDING,
      images: file ? [file.path] : [],
    });

    await productRepo.save(product);

    return product;
  }
  async getUserProducts(userId: string) {
    return productRepo.find({
      where: { seller: { id: userId } },
      order: { created_at: "DESC" },
    });
  }
}
