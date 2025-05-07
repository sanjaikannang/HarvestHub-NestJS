import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from 'src/schemas/user.schema';
import { LoginController } from './login/login.controller';
import { AuthService } from 'src/services/auth-service/auth.service';
import { UserRepositoryService } from 'src/repositories/user-repository/user.repository';
import { RegisterController } from './register/register.controller';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h'
                },
            }),
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [
        LoginController,
        RegisterController
    ],
    providers: [
        AuthService,
        UserRepositoryService
    ],
    exports: [
        AuthService,
        UserRepositoryService
    ],
})
export class AuthModule { }