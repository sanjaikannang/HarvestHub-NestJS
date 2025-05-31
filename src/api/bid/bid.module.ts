import { MongooseModule } from '@nestjs/mongoose';
import { Module } from "@nestjs/common";
import { ConfigService } from "src/config/config.service";
import { BidRepositoryService } from "src/repositories/bid-repository/bid.repository";
import { BidService } from "src/services/bid-service/bid.service";
import { Bid, BidSchema } from 'src/schemas/bid.schema';
import { ProductRepositoryService } from 'src/repositories/product-repository/product.repository';
import { UserRepositoryService } from 'src/repositories/user-repository/user.repository';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import { UserService } from 'src/services/user-service/user.service';
import { User, UserSchema } from 'src/schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Bid.name, schema: BidSchema }]),
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
    ],
    controllers: [        
    ],
    providers: [
        ConfigService,
        BidService,
        UserService,
        BidRepositoryService,
        ProductRepositoryService,
        UserRepositoryService
    ],
    exports: [
        ConfigService,
        BidService,
        UserService,
        BidRepositoryService,
        ProductRepositoryService,
        UserRepositoryService
    ],
})

export class BidModule { }
