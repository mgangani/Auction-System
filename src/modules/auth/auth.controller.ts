import {
  Body,
  Controller,
  Post,
  Route,
  Tags,
  SuccessResponse,
  Security,
  Get,
  Query,
} from "tsoa";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./auth.dto";

@Route("api/auth")
@Tags("Auth")
export class AuthController extends Controller {
  private authService = new AuthService();

  @Post("/register")
  @SuccessResponse("201", "Created")
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post("/login")
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post("/refresh")
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post("/logout")
  @Security("jwt")
  async logout(@Body() body: { token: string }) {
    return this.authService.logout(body.token);
  }

  @Get("/success")
  async googleSuccess(
    @Query() accessToken?: string,
    @Query() refreshToken?: string,
  ) {
    return {
      message: "Google login successful",
      accessToken,
      refreshToken,
    };
  }
}
