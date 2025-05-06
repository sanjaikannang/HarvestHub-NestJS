import { Module } from '@nestjs/common';
import { RepositoriesModule } from 'src/repositories/repositories.module';

@Module({
    imports: [
        RepositoriesModule
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class UserModule { }
