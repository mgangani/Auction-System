import {
  Controller,
  Post,
  Route,
  Tags,
  Security,
  Request,
  Path,
  Body,
  Query,
  Get,
} from "tsoa";
import { BidService } from "./bids.service";
import { PlaceBidDto } from "./bids.dto";
import { UserRole } from "../../types/enums";

@Route("api/products")
@Tags("Bids")
export class BidController extends Controller {
  private service = new BidService();

  @Get("/:id/bids")
  async getBidHistory(
    @Path() id: string,
    @Query() page: number = 1,
    @Query() limit: number = 10,
  ) {
    return this.service.getBidHistory(id, page, limit);
  }

  @Post("/:id/bids")
  @Security("jwt", [UserRole.USER])
  async placeBid(
    @Path() id: string,
    @Request() req: any,
    @Body() body: PlaceBidDto,
  ) {
    return this.service.placeBid(id, req.user.sub, body.amount);
  }
}
