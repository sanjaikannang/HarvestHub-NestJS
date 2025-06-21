import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class PlaceBidRequest {

    @IsOptional()
    @IsNumber()
    @IsNotEmpty()
    bidAmount?: number;

}
