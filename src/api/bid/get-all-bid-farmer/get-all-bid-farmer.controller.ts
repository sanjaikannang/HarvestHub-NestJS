import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { BidService } from "src/services/bid-service/bid.service";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";


@Controller('bid')
@UseGuards(JwtAuthGuard)
export class GetAllBidFarmerController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Roles(UserRole.FARMER)
    @Get('my-product-bids')
    async getMyProductBids(@Req() req) {

        const userId = req.user.userId;
        return this.bidService.getFarmerProductBids(farmerId);

    }

}
