import { Module } from "@nestjs/common";
import { ConfigService } from "src/config/config.service";
import { BidService } from "src/services/bid-service/bid.service";
import { PlaceBidController } from "./place-bid/place-bid.controller";

@Module({
    imports: [],
    controllers: [
        PlaceBidController,
        
    ],
    providers: [
        ConfigService,
        BidService
    ],
    exports: [],
})

export class BidModule { }
