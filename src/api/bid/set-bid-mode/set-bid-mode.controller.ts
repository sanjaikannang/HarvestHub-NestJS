import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { SetBidModeRequest } from "./set-bid-mode.request";
import { SetBidModeResponse } from "./set-bid-mode.response";
import { BidModeService } from "src/services/bid-mode-service/bid-mode.service";


@Controller('product')
@UseGuards(JwtAuthGuard)
export class SetBidModeController {

    constructor(
        private readonly bidModeService: BidModeService,
    ) { }

    @Roles(UserRole.BUYER)
    @Put('set-bid-mode/:productId')
    async setBidMode(
        @Param('productId') productId: string,
        @Body() setBidModeRequest: SetBidModeRequest,
        @Req() request: Request
    ): Promise<SetBidModeResponse> {

        const userId = request['user'].sub;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const result = await this.bidModeService.setBidMode({
            userId: userId,
            productId: productId,
            bidMode: setBidModeRequest.bidMode,
            autoIncrementAmount: setBidModeRequest.autoIncrementAmount
        });

        return result;
    }
}