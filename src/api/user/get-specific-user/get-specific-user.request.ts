import { IsNotEmpty, IsString } from "class-validator";

export class GetSpecificUserRequest {

    @IsString()
    @IsNotEmpty()
    userId: string;

}