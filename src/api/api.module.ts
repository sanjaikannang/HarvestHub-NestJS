import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AdminModule, 
    AuthModule, 
    UserModule
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApiModule { }
