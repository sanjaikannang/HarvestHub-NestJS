import { Body, Controller, Post } from "@nestjs/common";
import { CreateProductRequest } from "./create-product.request";
import { CreateProductResponse } from "./create-product.response";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { ProductService } from "src/services/product-service/product.service";

@Controller('product')
export class CreateProductController {

    constructor(
        private readonly createProductService: ProductService,
    ) { }

    @Roles(UserRole.FARMER)
    @Post('create-product')
    async createProduct(@Body() CreateProductRequest: CreateProductRequest): Promise<CreateProductResponse> {

        return this.createProductService.createProduct(CreateProductRequest); {

        }

    }
}