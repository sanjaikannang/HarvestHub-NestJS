import { Controller, Delete, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { ProductService } from "src/services/product-service/product.service";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { DeleteProductRequest } from "./delete-product.request";
import { DeleteProductResponse } from "./delete-product.response";

@Controller('product')
@UseGuards(JwtAuthGuard)
export class DeleteProductController {

    constructor(
        private readonly productService: ProductService,
    ) { }

    @Roles(UserRole.ADMIN, UserRole.FARMER)
    @Delete('delete-product/:productId')
    async deleteProduct(
        @Param() deleteProductRequest: DeleteProductRequest,
        @Req() request: Request
    ): Promise<DeleteProductResponse> {

        // Extract user ID from request object        
        const userId = request['user'].sub;
        const userRole = request['user'].role

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        if (!userRole) {
            throw new Error('User Role not found in request');
        }

        return this.productService.deleteProduct(deleteProductRequest, userId, userRole);

    }

}