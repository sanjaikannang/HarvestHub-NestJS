import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { BidService } from "src/services/bid-service/bid.service";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";


@Controller('bid')
@UseGuards(JwtAuthGuard)
export class GetAuctionStateController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Roles(UserRole.ADMIN)
    @Get('auction/:productId')
    async getAuctionState(@Param('productId') productId: string) {
        return this.bidService.getAuctionState(productId);
    }

}
