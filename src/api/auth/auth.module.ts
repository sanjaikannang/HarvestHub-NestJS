import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { LoginController } from './login/login.controller';
import { AuthService } from 'src/services/auth-service/auth.service';
import { UserRepositoryService } from 'src/repositories/user-repository/user.repository';
import { RegisterController } from './register/register.controller';
import { ConfigService } from 'src/config/config.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [
        LoginController,
        RegisterController
    ],
    providers: [
        ConfigService,
        AuthService,
        UserRepositoryService
    ],
    exports: [
        ConfigService,
        AuthService,
        UserRepositoryService
    ],
})
export class AuthModule { }