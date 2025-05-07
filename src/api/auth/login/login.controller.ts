import { Body, Controller, Post } from '@nestjs/common';
import { LoginRequest } from './login.request';
import { LoginResponse } from './login.response';
import { AuthService } from 'src/services/auth-service/auth.service';

@Controller('auth')
export class LoginController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('login')
    async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {

        return this.authService.login(loginRequest);
        
    }
}