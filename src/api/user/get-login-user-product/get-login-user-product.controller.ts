import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { GetLoginUserProductResponse } from "./get-login-user-product.response";
import { ProductService } from "src/services/product-service/product.service";

@Controller('product')
@UseGuards(JwtAuthGuard)
export class GetLoginUserProductController {

    constructor(
        private readonly productService: ProductService,
    ) { }

    @Roles(UserRole.FARMER, UserRole.BUYER)
    @Get('get-login-user-product')
    async createProduct(
        @Req() request: Request
    ): Promise<GetLoginUserProductResponse> {

        // Extract user ID from request object        
        const userId = request['user'].sub;
        const userRole = request['user'].role;

        if (!userId) {
            throw new
                Error('User ID not found in request');
        }

        if (!userRole) {
            throw new Error('User role not found in request');
        }

        return this.productService.getLoginUserProduct(userId, userRole);

    }
}