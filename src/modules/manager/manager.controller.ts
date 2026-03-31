import {
  Controller,
  Get,
  Patch,
  Route,
  Tags,
  Security,
  Path,
  Body,
} from "tsoa";
import { ManagerService } from "./manager.service";
import { ProductStatus, UserRole } from "../../types/enums";

@Route("api/manager/products")
@Tags("Manager")
@Security("jwt", [UserRole.MANAGER, UserRole.SUPERADMIN])
export class ManagerController extends Controller {
  private service = new ManagerService();

  @Get("/")
  async getPendingProducts() {
    return this.service.getPendingProducts();
  }

  @Patch('/:id/status')
  async updateProductStatus(@Path() id: string, @Body() body: { status: ProductStatus }) {
    return this.service.updateProductStatus(id, body.status);
  }
}
