import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginRequest {

    @IsEmail()
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password: string;

}