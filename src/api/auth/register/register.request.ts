import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from 'src/utils/enum';

export class RegisterRequest {

    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsEmail()
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password: string;

    @IsEnum(UserRole, { message: 'Role must be either Farmer or Buyer' })
    @IsNotEmpty({ message: 'Role is required' })
    role: UserRole;

}