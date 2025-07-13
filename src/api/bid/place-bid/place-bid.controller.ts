import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";
import { PlaceBidRequest } from "./place-bid.request";
import { PlaceBidResponse } from "./place-bid.response";
import { BidService } from "src/services/bid-service/bid.service";


@Controller('product')
@UseGuards(JwtAuthGuard)
export class PlaceBidController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Roles(UserRole.BUYER)
    @Post('place-bid/:productId')
    async placeBid(
        @Param('productId') productId: string,
        @Body() placeBidRequest: PlaceBidRequest,
        @Req() request: Request
    ): Promise<PlaceBidResponse> {

        // Extract user ID from request object        
        const userId = request['user'].sub;
        const userRole = request['user'].role

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        if (!userRole) {
            throw new Error('User Role not found in request');
        }

        // Convert current time to IST (UTC + 5:30)
        const currentTimeUTC = new Date();
        console.log('Current Time in UTC:', currentTimeUTC);
        const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
        console.log('IST Offset in milliseconds:', istOffset);
        const currentTimeIST = new Date(currentTimeUTC.getTime() + istOffset);
        console.log('Current Time in IST:', currentTimeIST);

        // Call the service method with proper parameters
        const result = await this.bidService.placeBid({
            productId: productId,
            bidderId: userId,
            bidAmount: placeBidRequest.bidAmount,
            bidTime: currentTimeIST
        });

        return result;

    }

}