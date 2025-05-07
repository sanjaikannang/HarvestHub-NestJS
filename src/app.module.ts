import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api/api.module';
import { ConfigModule } from './config/config.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.getMongoDbUri(),
        connectionFactory: (connection) => {
          // console.log('Connection factory called');
          connection.on('connected', () => {
            console.log('MongoDB connected successfully');
          });
          connection.once('open', () => {
            console.log('MongoDB connection opened');
          });
          connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule { }
