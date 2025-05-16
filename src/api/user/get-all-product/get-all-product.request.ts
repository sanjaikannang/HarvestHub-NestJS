import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString, Min } from "class-validator";
import { ProductStatus } from "src/utils/enum";

export class GetAllProductRequest {

    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(ProductStatus)
    productStatus?: ProductStatus;

}