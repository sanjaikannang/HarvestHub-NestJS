import { IsNotEmpty, IsString } from "class-validator";

export class DeleteUserRequest {

    @IsString()
    @IsNotEmpty()
    userId: string;

}