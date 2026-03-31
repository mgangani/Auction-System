import {
  Controller,
  Get,
  Post,
  Route,
  Tags,
  Path,
  Security,
  Request,
  FormField,
  UploadedFiles,
} from "tsoa";
import type { Express } from "express";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./products.dto";
import { UserRole } from "../../types/enums";

@Route("api/products")
@Tags("Products")
export class ProductController extends Controller {
  private service = new ProductService();

  @Get("/")
  async getProducts() {
    return this.service.getApprovedProducts();
  }
  @Get("/my")
  @Security("jwt")
  async getMyProducts(@Request() req: any) {
    return this.service.getUserProducts(req.user.sub);
  }

  @Get("/:id")
  async getProduct(@Path() id: string) {
    return this.service.getProductById(id);
  }

  @Post("/")
  @Security("jwt", [UserRole.USER])
  async createProduct(
    @Request() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @FormField() name: string,
    @FormField() description: string,
    @FormField() starting_price: number,
    @FormField() bidding_start_time: string,
    @FormField() bidding_end_time: string,
  ) {
    const body: CreateProductDto = {
      name,
      description,
      starting_price: Number(starting_price),
      bidding_start_time,
      bidding_end_time,
    };
    return this.service.createProduct(req.user.sub, body, files);
  }
}
