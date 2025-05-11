import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from "class-validator";

class Quantity {
    @IsNumber()
    @IsNotEmpty()
    value: number;

    @IsString()
    @IsNotEmpty()
    unit: string;
}

export class CreateProductRequest {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @ValidateNested()
    @Type(() => Quantity)
    quantity: Quantity;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    startingPrice: number;

    @IsDateString()
    @IsNotEmpty()
    bidStartDate: string;

    @IsDateString()
    @IsNotEmpty()
    bidEndDate: string;

    @IsString()
    @IsNotEmpty()
    bidStartTime: string;

    @IsString()
    @IsNotEmpty()
    bidEndTime: string;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(3)
    images: string[];

}