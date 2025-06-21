import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { BidModeService } from "src/services/bid-mode-service/bid-mode.service";
import { GetBidModeResponse } from "./get-bid-mode.response";


@Controller('product')
@UseGuards(JwtAuthGuard)
export class GetBidModeController {

    constructor(
        private readonly bidModeService: BidModeService,
    ) { }

    @Roles(UserRole.BUYER)
    @Get('get-bid-mode/:productId')
    async getBidMode(
        @Param('productId') productId: string,
        @Req() request: Request
    ): Promise<GetBidModeResponse> {

        const userId = request['user'].sub;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const result = await this.bidModeService.getBidMode(userId, productId);
        
        return result;
    }

}