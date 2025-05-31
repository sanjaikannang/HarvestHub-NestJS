import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { BidService } from "src/services/bid-service/bid.service";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";


@Controller('bid')
@UseGuards(JwtAuthGuard)
export class GetAllBidBuyerController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Roles(UserRole.BUYER)
    @Get('my-bids')
    async getMyBids(@Request() req) {
        const userId = req.user.userId;
        return this.bidService.getUserBids(userId);
    }

}
