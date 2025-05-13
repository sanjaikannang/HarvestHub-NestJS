import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { CreateProductRequest } from "./create-product.request";
import { CreateProductResponse } from "./create-product.response";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { ProductService } from "src/services/product-service/product.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";

@Controller('product')
@UseGuards(JwtAuthGuard)
export class CreateProductController {

    constructor(
        private readonly createProductService: ProductService,
    ) { }

    @Roles(UserRole.FARMER)
    @Post('create-product')
    async createProduct(
        @Body() CreateProductRequest: CreateProductRequest,
        @Req() request: Request
    ): Promise<CreateProductResponse> {

        // Extract user ID from request object        
        const currentUserId = request['user'].sub;

        if (!currentUserId) {
            throw new Error('User ID not found in request');
        }

        return this.createProductService.createProduct(CreateProductRequest, currentUserId);

    }
}