import {
  Controller,
  Get,
  Post,
  Route,
  Tags,
  Query,
  Path,
  Security,
  Request,
  Body,
} from "tsoa";
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
  async createProduct(@Request() req: any, @Body() body: CreateProductDto) {
    return this.service.createProduct(req.user.sub, body, req.file);
  }
}
