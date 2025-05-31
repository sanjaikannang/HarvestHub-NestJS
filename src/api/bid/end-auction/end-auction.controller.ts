import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { BidService } from "src/services/bid-service/bid.service";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";


@Controller('bid')
@UseGuards(JwtAuthGuard)
export class EndAuctionController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Roles(UserRole.ADMIN)
    @Post('end-auction/:productId')
    async endAuction(@Param('productId') productId: string) {
        return this.bidService.endAuction(productId);
    }

}
