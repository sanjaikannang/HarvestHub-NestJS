import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ProductService } from "src/services/product-service/product.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { GetSpecificProductRequest } from "./get-specific-product.request";
import { GetSpecificProductResponse } from "./get-specific-product.response";

@Controller('product')
@UseGuards(JwtAuthGuard)
export class GetSpecificProductController {

    constructor(
        private readonly productService: ProductService,
    ) { }

    @Get('get-specific-product/:productId')
    async getSpecificProduct(
        @Param() getSpecificProductRequest: GetSpecificProductRequest,
        @Req() request: Request
    ): Promise<GetSpecificProductResponse> {

        // Extract user ID from request object        
        const userId = request['user'].sub;

        if (!userId) {
            throw new 
            Error('User ID not found in request');
        }

        return this.productService.getSpecificProduct(getSpecificProductRequest);

    }
}