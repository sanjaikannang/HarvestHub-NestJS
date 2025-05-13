import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateProductController } from './create-product/create-product.controller';
import { ConfigService } from 'src/config/config.service';
import { ProductRepositoryService } from 'src/repositories/product-repository/product.repository';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import { ProductService } from 'src/services/product-service/product.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    ],
    controllers: [
        CreateProductController
    ],
    providers: [
        ConfigService,
        ProductService,
        ProductRepositoryService
    ],
    exports: [],
})
export class UserModule { }
