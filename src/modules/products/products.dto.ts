import { IsString, IsNumber, Min, IsDateString } from "class-validator";
import { IsDateAfter } from "../../utils/validators/isDateAfter";

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(1)
  starting_price!: number;

  @IsDateString()
  bidding_start_time!: string;

  @IsDateString()
  @IsDateAfter("bidding_start_time", {
    message: "bidding_end_time must be after bidding_start_time",
  })
  bidding_end_time!: string;
}
