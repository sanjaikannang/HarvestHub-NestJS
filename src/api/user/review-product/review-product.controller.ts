import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { ReviewProductRequest } from "./review-product.request";
import { ReviewProductResponse } from "./review-product.response";
import { ProductService } from "src/services/product-service/product.service";

@Controller('product')
@UseGuards(JwtAuthGuard)
export class ReviewProductController {

    constructor(
        private readonly productService: ProductService
    ) { }

    @Roles(UserRole.ADMIN)
    @Post('review-product/:productId')
    async createProduct(
        @Param('productId') productId: string,
        @Body() reviewProductRequest: ReviewProductRequest,
        @Req() request: Request
    ): Promise<ReviewProductResponse> {

        // Extract user ID from request object        
        const adminId  = request['user'].sub;

        if (!adminId ) {
            throw new
                Error('User ID not found in request');
        }

        // Combine productId from path with the rest of the request body
        reviewProductRequest.productId = productId;

        return this.productService.reviewProduct(reviewProductRequest, adminId );

    }


}