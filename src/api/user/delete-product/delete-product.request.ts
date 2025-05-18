import { IsNotEmpty, IsString } from "class-validator";

export class DeleteProductRequest {

    @IsString()
    @IsNotEmpty()
    productId: string;

}