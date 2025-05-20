import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { BidService } from "src/services/bid-service/bid.service";
import { GetSpecificBidResponse } from "./get-specific-bid.response";


@Controller('bid')
@UseGuards(JwtAuthGuard)
export class GetSpecificBidController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Get('product/:productId')
    async getSpecificBid(
        @Param('productId') productId: string,
        @Req() request: Request,
    ): Promise<GetSpecificBidResponse> {

        // Add authorization logic here - Admin can view all, 
        // Farmer can view their own products, Buyer can see products they bid on
        return this.bidService.getBidsForProduct(productId);

    }

}
