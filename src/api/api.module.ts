import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BidModule } from './bid/bid.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    BidModule
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApiModule { }
