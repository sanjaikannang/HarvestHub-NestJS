import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterRequest } from './register.request';
import { RegisterResponse } from './register.response';
import { AuthService } from 'src/services/auth-service/auth.service';

@Controller('auth')
export class RegisterController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('register')
    async register(@Body() registerRequest: RegisterRequest): Promise<RegisterResponse> {

        console.log('Register Request:', registerRequest);

        return this.authService.register(registerRequest);

    }
}