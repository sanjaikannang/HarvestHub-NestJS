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
import { GetAllBidsController } from './get-all-bids/get-all-bids.controller';
import { PlaceBidController } from './place-bid/place-bid.controller';
import { BidModeService } from 'src/services/bid-mode-service/bid-mode.service';
import { SetBidModeController } from './set-bid-mode/set-bid-mode.controller';
import { GetBidModeController } from './get-bid-mode/get-bid-mode.controller';
import { BidModeRepositoryService } from 'src/repositories/bid-mode-repository/bid-mode-repository';
import { BidMode, BidModeSchema } from 'src/schemas/bid-mode.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Bid.name, schema: BidSchema }]),
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: BidMode.name, schema: BidModeSchema }])
    ],
    controllers: [
        GetAllBidsController,
        PlaceBidController,
        SetBidModeController,
        GetBidModeController
    ],
    providers: [
        ConfigService,
        BidService,
        UserService,
        BidRepositoryService,
        ProductRepositoryService,
        UserRepositoryService,
        BidModeService,
        BidModeRepositoryService
    ],
    exports: [
        ConfigService,
        BidService,
        UserService,
        BidRepositoryService,
        ProductRepositoryService,
        UserRepositoryService,
        BidModeService,
        BidModeRepositoryService
    ],
})

export class BidModule { }
