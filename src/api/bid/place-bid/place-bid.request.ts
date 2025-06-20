import { IsNotEmpty, IsNumber } from "class-validator";

export class PlaceBidRequest {

    @IsNumber()
    @IsNotEmpty()
    bidAmount: number;

}
