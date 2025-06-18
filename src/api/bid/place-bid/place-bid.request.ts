import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class PlaceBidRequest {

    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @IsNotEmpty()
    bidAmount: number;

}
