import { Controller, Delete, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { UserService } from "src/services/user-service/user.service";
import { DeleteUserRequest } from "./delete-user.request";
import { DeleteUserResponse } from "./delete-user.response";
import { Roles } from "src/utils/roles.decorator";
import { UserRole } from "src/utils/enum";

@Controller('user')
@UseGuards(JwtAuthGuard)
export class DeleteUserController {
    constructor(
        private readonly userService: UserService,
    ) { }

    @Roles(UserRole.ADMIN)
    @Delete('delete-user/:userId')
    async deleteUser(
        @Param() deleteUserRequest: DeleteUserRequest,
    ): Promise<DeleteUserResponse> {

        return this.userService.deleteUser(deleteUserRequest);

    }

}