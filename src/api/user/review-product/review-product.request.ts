import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { ProductStatus } from "src/utils/enum";

export class ReviewProductRequest {

    @IsOptional()
    @IsString()
    productId: string;

    @IsEnum(ProductStatus)
    @IsNotEmpty()
    status: ProductStatus;

    @ValidateIf(o => o.status === ProductStatus.REJECTED)
    @IsString()
    @IsNotEmpty()
    adminFeedback: string;

}