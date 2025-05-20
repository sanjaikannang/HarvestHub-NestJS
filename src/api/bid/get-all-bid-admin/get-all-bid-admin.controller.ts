import { Controller, Get, NotFoundException, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { BidService } from "src/services/bid-service/bid.service";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";


@Controller('bid')
@UseGuards(JwtAuthGuard)
export class GetAllBidAdminController {

    constructor(
        private readonly bidService: BidService,
    ) { }

    @Roles(UserRole.ADMIN)
    @Get()
    async getAllBids() {

        // You'd need to implement this in the service
        throw new NotFoundException('Not implemented');

    }

}
