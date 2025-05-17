import { IsNotEmpty, IsString } from "class-validator";

export class GetSpecificProductRequest {

    @IsString()
    @IsNotEmpty()
    productId: string;

}