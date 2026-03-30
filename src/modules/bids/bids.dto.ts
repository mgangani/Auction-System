import { IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class PlaceBidDto {
    
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;
}
