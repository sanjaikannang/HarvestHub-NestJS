import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserService } from "src/services/user-service/user.service";
import { GetAllUserRequest } from "./get-all-user.request";
import { GetAllUserResponse } from "./get-all-user.response";
import { UserRole } from "src/utils/enum";
import { Roles } from "src/utils/roles.decorator";

@Controller('user')
@UseGuards(JwtAuthGuard)
export class GetAllUserController {

    constructor(
        private readonly userService: UserService
    ) { }

    @Roles(UserRole.ADMIN)
    @Get('get-all-user')
    async createProduct(
        @Query() getAllUserRequest: GetAllUserRequest,
        @Req() request: Request
    ): Promise<GetAllUserResponse> {

        // Extract user ID from request object        
        const userId = request['user'].sub;

        if (!userId) {
            throw new
                Error('User ID not found in request');
        }

        return this.userService.getAllUser(getAllUserRequest);

    }

}