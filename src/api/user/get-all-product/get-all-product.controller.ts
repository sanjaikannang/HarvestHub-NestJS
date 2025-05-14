import { Controller, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ProductService } from "src/services/product-service/product.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { GetAllProductRequest } from "./get-all-product.request";
import { GetAllProductResponse } from "./get-all-product.response";

@Controller('product')
@UseGuards(JwtAuthGuard)
export class GetAllProductController {

    constructor(
        private readonly productService: ProductService,
    ) { }

    @Post('get-all-product')
    async createProduct(
        @Query() getAllProductRequest: GetAllProductRequest,
        @Req() request: Request
    ): Promise<GetAllProductResponse> {

        // Extract user ID from request object        
        const userId = request['user'].sub;
        const userRole = request['user'].role

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        return this.productService.getAllProduct(getAllProductRequest, userId, userRole);

    }
}