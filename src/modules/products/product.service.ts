import { AppDataSource } from "../../config/database";
import { Bid } from "../../entity/Bid";
import { Product } from "../../entity/Product";
import { ProductStatus } from "../../types/enums";
import { getOrSet } from "../../utils/cache";
import { CreateProductDto } from "./products.dto";
import { cloudinary } from "../../config/cloudinary";

const productRepo = AppDataSource.getRepository(Product);

export class ProductService {
  async getApprovedProducts() {
    const key = `products:approved`;
    return getOrSet(key, 60, async () => {
      const products = await productRepo.find({
        where: { status: ProductStatus.APPROVED },
        order: { created_at: "DESC" },
      });
      return products;
    });
  }

  async getProductById(id: string) {
    const key = `product:${id}`;

    return getOrSet(key, 30, async () => {
      const product = await productRepo.findOne({
        where: { id, status: ProductStatus.APPROVED },
        relations: ["bids"],
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const highestBid =
        product.bids?.length > 0
          ? Math.max(...product.bids.map((b) => Number(b.amount)))
          : Number(product.starting_price);

      return {
        ...product,
        current_highest_bid: highestBid,
      };
    });
  }

  async createProduct(
    userId: string,
    dto: CreateProductDto,
    files?: Express.Multer.File[],
  ) {
    let imageUrls: string[] = [];

    if (files && files.length > 0) {
      imageUrls = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder: "products" },
                (error, result) => {
                  if (error || !result) return reject(error);
                  resolve((result as any).secure_url);
                },
              );
              stream.end(file.buffer);
            }),
        ),
      );
    }

    const product = productRepo.create({
      name: dto.name,
      description: dto.description,
      starting_price: dto.starting_price,
      current_highest_bid: dto.starting_price,
      bidding_start_time: dto.bidding_start_time,
      bidding_end_time: dto.bidding_end_time,
      seller: { id: userId },
      status: ProductStatus.PENDING,
      images: imageUrls,
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
