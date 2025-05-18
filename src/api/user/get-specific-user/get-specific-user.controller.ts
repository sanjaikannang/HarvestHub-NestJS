import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { GetSpecificUserRequest } from "./get-specific-user.request";
import { GetSpecificUserResponse } from "./get-specific-user.response";
import { UserService } from "src/services/user-service/user.service";


@Controller('user')
@UseGuards(JwtAuthGuard)
export class GetSpecificUserController {

    constructor(
        private readonly userService: UserService,
    ) { }

    @Get('get-specific-user/:userId')
    async getSpecificUser(
        @Param() getSpecificUserRequest: GetSpecificUserRequest,
        @Req() request: Request
    ): Promise<GetSpecificUserResponse> {

        // Extract user ID from request object        
        const userId = request['user'].sub;

        if (!userId) {
            throw new
                Error('User ID not found in request');
        }

        return this.userService.getSpecificUser(getSpecificUserRequest);

    }

}