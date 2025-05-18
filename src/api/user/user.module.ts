import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateProductController } from './create-product/create-product.controller';
import { ConfigService } from 'src/config/config.service';
import { ProductRepositoryService } from 'src/repositories/product-repository/product.repository';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import { ProductService } from 'src/services/product-service/product.service';
import { GetAllProductController } from './get-all-product/get-all-product.controller';
import { GetSpecificProductController } from './get-specific-product/get-specific-product.controller';
import { UserService } from 'src/services/user-service/user.service';
import { GetSpecificUserController } from './get-specific-user/get-specific-user.controller';
import { UserRepositoryService } from 'src/repositories/user-repository/user.repository';
import { User, UserSchema } from 'src/schemas/user.schema';
import { GetAllUserController } from './get-all-user/get-all-user.controller';
import { ReviewProductController } from './review-product/review-product.controller';
import { GetLoginUserProductController } from './get-login-user-product/get-login-user-product.controller';
import { DeleteUserController } from './delete-user/delete-user.controller';
import { DeleteProductController } from './delete-product/delete-product.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [
        CreateProductController,
        GetAllProductController,
        GetSpecificProductController,
        GetSpecificUserController,
        GetAllUserController,
        ReviewProductController,
        GetLoginUserProductController,
        DeleteUserController,
        DeleteProductController
    ],
    providers: [
        ConfigService,
        ProductService,
        UserService,
        ProductRepositoryService,
        UserRepositoryService
    ],
    exports: [],
})
export class UserModule { }
