import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { GetAllBidsResponse } from "./get-all-bids.response";
import { BidService } from "src/services/bid-service/bid.service";

@Controller('product')
@UseGuards(JwtAuthGuard)
export class GetAllBidsController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Roles(UserRole.FARMER, UserRole.BUYER, UserRole.ADMIN)
    @Get('/get-all-bids/:productId')
    async getAllBids(
        @Param('productId') productId: string,
    ): Promise<GetAllBidsResponse> {

        // Validate productId
        if (!productId) {
            throw new Error('Product ID is required');
        }

        // Call the service method
        const result = await this.bidService.getAllBidsByProductId(productId);

        return result;
    }
}