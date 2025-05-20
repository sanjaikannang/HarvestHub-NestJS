import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { PlaceBidRequest } from "./place-bid.request";
import { PlaceBidResponse } from "./place-bid.response";
import { BidService } from "src/services/bid-service/bid.service";


@Controller('bid')
@UseGuards(JwtAuthGuard)
export class PlaceBidController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Roles(UserRole.BUYER)
    @Post('place-bid')
    async placeBid(
        @Body() placeBidRequest: PlaceBidRequest,
        @Req() request: Request,
    ): Promise<PlaceBidResponse> {

        const userId = request['user'].sub;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const result = await this.bidService.placeBid(placeBidRequest, userId);

        return result;

    }

}
