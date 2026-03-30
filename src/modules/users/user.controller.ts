import {
  Controller,
  Get,
  Patch,
  Route,
  Tags,
  Security,
  Request,
  Path,
  Body,
} from "tsoa";
import { UserService } from "./user.service";
import { UserRole } from "../../types/enums";

@Route("api/users")
@Tags("Users")
export class UserController extends Controller {
  private userService = new UserService();

  @Get("/me")
  @Security("jwt")
  async getMe(@Request() req: any) {
    return this.userService.getProfile(req.user.sub);
  }

  @Patch("/:id/role")
  @Security("jwt", [UserRole.SUPERADMIN])
  async updateRole(@Path() id: string, @Body() body: { role: UserRole.MANAGER }) {
    return this.userService.updateRole(id, body.role);
  }
}
