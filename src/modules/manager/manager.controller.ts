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
import { UserRole } from "../../types/enums";

@Route("api/manager/products")
@Tags("Manager")
@Security("jwt", [UserRole.MANAGER, UserRole.SUPERADMIN])
export class ManagerController extends Controller {
  private service = new ManagerService();

  @Get("/")
  async getPendingProducts() {
    return this.service.getPendingProducts();
  }

  @Patch("/:id/approve")
  async approveProduct(@Path() id: string) {
    return this.service.approveProduct(id);
  }

  @Patch("/:id/reject")
  async rejectProduct(@Path() id: string, @Body() body: { reason?: string }) {
    return this.service.rejectProduct(id, body.reason);
  }
}
